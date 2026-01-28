/**
 * WebSocket Server for Chrome Extension Communication
 * Handles bidirectional communication between the extension and MCP server
 */

import { WebSocketServer, WebSocket } from "ws";
import type {
  WebSocketMessage,
  ConnectPayload,
  SubmitFeedbackPayload,
  StatusPayload,
  ErrorPayload,
  Annotation,
  DEFAULT_MCP_SERVER_PORT,
} from "@agentation/shared";

export interface ExtensionClient {
  ws: WebSocket;
  pageUrl: string;
  pageTitle: string;
  connectedAt: Date;
}

export interface FeedbackSubmission {
  id: string;
  client: ExtensionClient;
  payload: SubmitFeedbackPayload;
  submittedAt: Date;
  status: "pending" | "processing" | "completed" | "failed";
  response?: string;
}

type FeedbackHandler = (
  submission: FeedbackSubmission,
) => Promise<string | undefined>;

export class AgentationWebSocketServer {
  private wss: WebSocketServer | null = null;
  private clients: Map<WebSocket, ExtensionClient> = new Map();
  private pendingSubmissions: Map<string, FeedbackSubmission> = new Map();
  private feedbackHandler: FeedbackHandler | null = null;
  private port: number;
  private samplingSupported: boolean = true;

  constructor(port: number = 19989) {
    this.port = port;
  }

  setSamplingSupported(supported: boolean): void {
    this.samplingSupported = supported;
  }

  /**
   * Start the WebSocket server
   */
  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.wss = new WebSocketServer({ port: this.port });

        this.wss.on("connection", (ws) => {
          console.log("[WS] New connection");
          this.handleConnection(ws);
        });

        this.wss.on("error", (error) => {
          console.error("[WS] Server error:", error);
          reject(error);
        });

        this.wss.on("listening", () => {
          console.log(`[WS] Server listening on port ${this.port}`);
          resolve();
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stop the WebSocket server
   */
  stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.wss) {
        // Close all client connections
        for (const [ws] of this.clients) {
          ws.close(1000, "Server shutting down");
        }
        this.clients.clear();

        this.wss.close(() => {
          console.log("[WS] Server stopped");
          this.wss = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Set the handler for feedback submissions
   * This is called by the MCP server when feedback needs to be processed
   */
  setFeedbackHandler(handler: FeedbackHandler): void {
    this.feedbackHandler = handler;
  }

  /**
   * Get the number of connected clients
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Get all connected clients
   */
  getClients(): ExtensionClient[] {
    return Array.from(this.clients.values());
  }

  /**
   * Send a message to a specific client
   */
  sendToClient(ws: WebSocket, message: WebSocketMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Broadcast a message to all connected clients
   */
  broadcast(message: WebSocketMessage): void {
    for (const [ws] of this.clients) {
      this.sendToClient(ws, message);
    }
  }

  /**
   * Send feedback result back to the extension
   */
  sendFeedbackResult(
    submissionId: string,
    success: boolean,
    response?: string,
    error?: string,
  ): void {
    const submission = this.pendingSubmissions.get(submissionId);
    if (!submission) {
      console.warn(`[WS] Submission not found: ${submissionId}`);
      return;
    }

    const message: WebSocketMessage = {
      type: "feedback-result",
      id: submissionId,
      payload: {
        requestId: submissionId,
        success,
        message: error,
        response,
      },
      timestamp: new Date().toISOString(),
    };

    this.sendToClient(submission.client.ws, message);
    submission.status = success ? "completed" : "failed";
    submission.response = response;
  }

  private handleConnection(ws: WebSocket): void {
    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString()) as WebSocketMessage;
        this.handleMessage(ws, message);
      } catch (error) {
        console.error("[WS] Failed to parse message:", error);
        this.sendError(ws, "INVALID_MESSAGE", "Failed to parse message");
      }
    });

    ws.on("close", () => {
      const client = this.clients.get(ws);
      if (client) {
        console.log(`[WS] Client disconnected: ${client.pageUrl}`);
        this.clients.delete(ws);
      }
    });

    ws.on("error", (error) => {
      console.error("[WS] Client error:", error);
    });
  }

  private handleMessage(ws: WebSocket, message: WebSocketMessage): void {
    console.log(`[WS] Received message: ${message.type}`);

    switch (message.type) {
      case "connect":
        this.handleConnect(ws, message.payload as ConnectPayload);
        break;

      case "disconnect":
        this.handleDisconnect(ws);
        break;

      case "submit-feedback":
        this.handleSubmitFeedback(ws, message);
        break;

      case "status":
        this.handleStatusRequest(ws);
        break;

      default:
        this.sendError(
          ws,
          "INVALID_MESSAGE",
          `Unknown message type: ${message.type}`,
        );
    }
  }

  private handleConnect(ws: WebSocket, payload: ConnectPayload): void {
    const client: ExtensionClient = {
      ws,
      pageUrl: payload.pageUrl,
      pageTitle: payload.pageTitle,
      connectedAt: new Date(),
    };

    this.clients.set(ws, client);
    console.log(`[WS] Client connected: ${payload.pageUrl}`);

    // Send status confirmation
    this.sendStatus(ws);
  }

  private handleDisconnect(ws: WebSocket): void {
    const client = this.clients.get(ws);
    if (client) {
      console.log(`[WS] Client requested disconnect: ${client.pageUrl}`);
      this.clients.delete(ws);
    }
    ws.close(1000, "Client requested disconnect");
  }

  private async handleSubmitFeedback(
    ws: WebSocket,
    message: WebSocketMessage,
  ): Promise<void> {
    const client = this.clients.get(ws);
    if (!client) {
      this.sendError(ws, "CONNECTION_FAILED", "Client not connected");
      return;
    }

    const payload = message.payload as SubmitFeedbackPayload;
    const submissionId =
      message.id ||
      `fb_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const submission: FeedbackSubmission = {
      id: submissionId,
      client,
      payload,
      submittedAt: new Date(),
      status: "pending",
    };

    this.pendingSubmissions.set(submissionId, submission);
    console.log(
      `[WS] Feedback submitted: ${submissionId} with ${payload.annotations.length} annotations`,
    );

    // Process the feedback if handler is set
    if (this.feedbackHandler) {
      submission.status = "processing";
      try {
        const response = await this.feedbackHandler(submission);
        this.sendFeedbackResult(submissionId, true, response);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        this.sendFeedbackResult(submissionId, false, undefined, errorMessage);
      }
    } else {
      // No handler set, acknowledge receipt but note that processing is pending
      this.sendFeedbackResult(
        submissionId,
        true,
        "Feedback received. Waiting for MCP client to process via sampling.",
      );
    }
  }

  private handleStatusRequest(ws: WebSocket): void {
    this.sendStatus(ws);
  }

  private sendStatus(ws: WebSocket): void {
    const status: StatusPayload = {
      connected: true,
      mcpConnected: this.feedbackHandler !== null,
      samplingSupported:
        this.feedbackHandler !== null && this.samplingSupported,
    };

    const message: WebSocketMessage<StatusPayload> = {
      type: "status",
      payload: status,
      timestamp: new Date().toISOString(),
    };

    this.sendToClient(ws, message);
  }

  private sendError(ws: WebSocket, code: string, errorMessage: string): void {
    const payload: ErrorPayload = {
      code,
      message: errorMessage,
    };

    const message: WebSocketMessage<ErrorPayload> = {
      type: "error",
      payload,
      timestamp: new Date().toISOString(),
    };

    this.sendToClient(ws, message);
  }
}
