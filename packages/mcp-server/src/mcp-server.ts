/**
 * Agentation MCP Server
 * Provides MCP tools for UI feedback processing with sampling support
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import {
  AgentationWebSocketServer,
  type FeedbackSubmission,
} from "./websocket-server.js";
import type { Annotation, SubmitFeedbackPayload } from "@agentation/shared";

// Schema for the submit-feedback tool
const SubmitFeedbackSchema = z.object({
  pageUrl: z.string().describe("The URL of the page being annotated"),
  pageTitle: z.string().describe("The title of the page"),
  annotations: z
    .array(
      z.object({
        id: z.number(),
        isGroup: z.boolean().optional(),
        selector: z.string().optional(),
        selectors: z.array(z.string()).optional(),
        description: z.string().optional(),
        descriptions: z.array(z.string()).optional(),
        feedback: z.string(),
        timestamp: z.string(),
      }),
    )
    .describe("Array of UI annotations with feedback"),
  additionalContext: z
    .string()
    .optional()
    .describe("Additional context for the AI"),
});

export class AgentationMCPServer {
  private server: Server;
  private wsServer: AgentationWebSocketServer;
  private pendingFeedback: Map<
    string,
    {
      submission: FeedbackSubmission;
      resolve: (response: string | undefined) => void;
      reject: (error: Error) => void;
    }
  > = new Map();

  private feedbackQueueForNonSamplingClients: Array<{
    id: string;
    payload: SubmitFeedbackPayload;
    submittedAt: Date;
    prompt: string;
  }> = [];
  private samplingSupportStatus: "unknown" | "supported" | "unsupported" =
    "unknown";

  constructor(wsPort: number = 19989) {
    this.wsServer = new AgentationWebSocketServer(wsPort);

    this.server = new Server(
      {
        name: "agentation",
        version: "0.1.0",
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "get-pending-feedback",
            description:
              "Get pending UI feedback from the Chrome extension. Returns annotations that users have made on web pages.",
            inputSchema: {
              type: "object",
              properties: {},
              required: [],
            },
          },
          {
            name: "get-connection-status",
            description:
              "Get the connection status of the Agentation Chrome extension",
            inputSchema: {
              type: "object",
              properties: {},
              required: [],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case "get-pending-feedback":
          return this.handleGetPendingFeedback();

        case "get-connection-status":
          return this.handleGetConnectionStatus();

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  private async handleGetPendingFeedback(): Promise<{
    content: Array<{ type: "text"; text: string }>;
  }> {
    const clients = this.wsServer.getClients();

    if (this.feedbackQueueForNonSamplingClients.length > 0) {
      const feedbackItems = this.feedbackQueueForNonSamplingClients.map(
        (item) => ({
          id: item.id,
          pageUrl: item.payload.pageUrl,
          pageTitle: item.payload.pageTitle,
          annotationCount: item.payload.annotations.length,
          submittedAt: item.submittedAt.toISOString(),
          prompt: item.prompt,
        }),
      );

      this.feedbackQueueForNonSamplingClients = [];

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                feedbackCount: feedbackItems.length,
                feedback: feedbackItems,
              },
              null,
              2,
            ),
          },
        ],
      };
    }

    if (clients.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: "No Chrome extension clients connected. Please open the Agentation extension on a web page.",
          },
        ],
      };
    }

    const clientInfo = clients.map((c) => ({
      pageUrl: c.pageUrl,
      pageTitle: c.pageTitle,
      connectedAt: c.connectedAt.toISOString(),
    }));

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              connectedClients: clientInfo,
              pendingFeedback: 0,
              message:
                "No pending feedback. Waiting for user to submit feedback from the extension.",
            },
            null,
            2,
          ),
        },
      ],
    };
  }

  private async handleGetConnectionStatus(): Promise<{
    content: Array<{ type: "text"; text: string }>;
  }> {
    const clientCount = this.wsServer.getClientCount();
    const clients = this.wsServer.getClients();

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              status: clientCount > 0 ? "connected" : "disconnected",
              clientCount,
              clients: clients.map((c) => ({
                pageUrl: c.pageUrl,
                pageTitle: c.pageTitle,
                connectedAt: c.connectedAt.toISOString(),
              })),
            },
            null,
            2,
          ),
        },
      ],
    };
  }

  private async processFeedbackWithSampling(
    submission: FeedbackSubmission,
  ): Promise<string | undefined> {
    const { payload } = submission;
    const prompt = this.buildFeedbackPrompt(payload);

    if (this.samplingSupportStatus === "unsupported") {
      return this.queueFeedbackForManualRetrieval(
        submission.id,
        payload,
        prompt,
      );
    }

    try {
      const result = await this.server.createMessage({
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: prompt,
            },
          },
        ],
        systemPrompt: `You are an AI assistant helping to implement UI feedback from users. 
You will receive annotations and feedback about specific UI elements on a web page.
Your job is to understand the feedback and suggest or implement the requested changes.
Focus on being helpful, specific, and actionable.`,
        maxTokens: 4096,
        modelPreferences: {
          hints: [{ name: "claude-3-5-sonnet" }, { name: "claude" }],
          intelligencePriority: 0.8,
          speedPriority: 0.5,
        },
      });

      this.samplingSupportStatus = "supported";
      this.wsServer.setSamplingSupported(true);

      if (result.content.type === "text") {
        return result.content.text;
      }

      return "AI response received (non-text format)";
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const isSamplingNotSupported =
        errorMessage.includes("not supported") ||
        errorMessage.includes("createMessage") ||
        errorMessage.includes("sampling") ||
        errorMessage.includes("Method not found");

      if (isSamplingNotSupported && this.samplingSupportStatus === "unknown") {
        console.log(
          "[MCP] Sampling not supported by this client (e.g., Claude Code). Using fallback mode.",
        );
        this.samplingSupportStatus = "unsupported";
        this.wsServer.setSamplingSupported(false);
        return this.queueFeedbackForManualRetrieval(
          submission.id,
          payload,
          prompt,
        );
      }

      console.error("[MCP] Sampling request failed:", errorMessage);
      throw error;
    }
  }

  private queueFeedbackForManualRetrieval(
    id: string,
    payload: SubmitFeedbackPayload,
    prompt: string,
  ): string {
    this.feedbackQueueForNonSamplingClients.push({
      id,
      payload,
      submittedAt: new Date(),
      prompt,
    });

    return `Feedback queued successfully. Your MCP client (e.g., Claude Code) does not support automatic sampling. Please use the "get-pending-feedback" tool to retrieve and process this feedback.`;
  }

  private buildFeedbackPrompt(payload: SubmitFeedbackPayload): string {
    const { pageUrl, pageTitle, annotations, additionalContext } = payload;

    let prompt = `# UI Feedback Request\n\n`;
    prompt += `**Page:** ${pageTitle}\n`;
    prompt += `**URL:** ${pageUrl}\n\n`;
    prompt += `---\n\n`;
    prompt += `## Annotations\n\n`;

    annotations.forEach((annotation, index) => {
      const isGroup = "isGroup" in annotation && annotation.isGroup;

      if (isGroup) {
        prompt += `### ${index + 1}. Group Annotation (${(annotation as any).selectors?.length || 0} elements)\n\n`;
        prompt += `**Elements:**\n`;
        const selectors = (annotation as any).selectors || [];
        const descriptions = (annotation as any).descriptions || [];
        selectors.forEach((sel: string, i: number) => {
          prompt += `- ${descriptions[i] || "Element"}: \`${sel}\`\n`;
        });
      } else {
        prompt += `### ${index + 1}. ${(annotation as any).description || "Element"}\n\n`;
        prompt += `**Selector:** \`${(annotation as any).selector || "unknown"}\`\n\n`;
      }

      prompt += `\n**Feedback:**\n${annotation.feedback}\n\n`;
      prompt += `---\n\n`;
    });

    if (additionalContext) {
      prompt += `## Additional Context\n\n${additionalContext}\n\n`;
    }

    prompt += `## Instructions\n\n`;
    prompt += `Please analyze the above feedback and help implement the requested changes. `;
    prompt += `If code changes are needed, provide specific suggestions or implementations. `;
    prompt += `If clarification is needed, ask specific questions.\n`;

    return prompt;
  }

  /**
   * Start the MCP server and WebSocket server
   */
  async start(): Promise<void> {
    // Start WebSocket server for extension communication
    await this.wsServer.start();

    // Set up feedback handler to use sampling
    this.wsServer.setFeedbackHandler(async (submission) => {
      return this.processFeedbackWithSampling(submission);
    });

    // Connect to stdio transport for MCP
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    console.log("[MCP] Agentation MCP server started");
  }

  /**
   * Stop the servers
   */
  async stop(): Promise<void> {
    await this.wsServer.stop();
    await this.server.close();
    console.log("[MCP] Agentation MCP server stopped");
  }
}
