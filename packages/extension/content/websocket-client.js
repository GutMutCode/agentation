/**
 * WebSocket Client for Agentation MCP Server Communication
 * Handles bidirectional communication between the extension and MCP server
 */

(function () {
  "use strict";

  const DEFAULT_SERVER_URL = "ws://localhost:19989";
  const RECONNECT_DELAY = 3000;
  const MAX_RECONNECT_ATTEMPTS = 3;

  class AgentationWebSocketClient {
    constructor() {
      this.ws = null;
      this.serverUrl = DEFAULT_SERVER_URL;
      this.connected = false;
      this.reconnectAttempts = 0;
      this.messageHandlers = new Map();
      this.pendingRequests = new Map();
      this.onStatusChange = null;
      this.onFeedbackResult = null;
      this.autoReconnect = true;
      this.hasEverConnected = false;
      this.silent = false;
    }

    /**
     * Connect to the MCP server
     * @param {string} url - Server URL
     * @param {boolean} silent - Suppress connection error logs (for background auto-connect)
     */
    connect(url = DEFAULT_SERVER_URL, silent = false) {
      this.silent = silent;

      return new Promise((resolve, reject) => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          resolve();
          return;
        }

        this.serverUrl = url;

        try {
          this.ws = new WebSocket(url);

          this.ws.onopen = () => {
            console.log("[Agentation] Connected to MCP server");
            this.connected = true;
            this.hasEverConnected = true;
            this.reconnectAttempts = 0;

            this.sendConnect();

            if (this.onStatusChange) {
              this.onStatusChange({ connected: true });
            }

            resolve();
          };

          this.ws.onclose = (event) => {
            this.connected = false;

            if (this.onStatusChange) {
              this.onStatusChange({ connected: false });
            }

            // Only auto-reconnect if we were previously connected
            if (
              this.autoReconnect &&
              this.hasEverConnected &&
              event.code !== 1000 &&
              this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS
            ) {
              this.reconnectAttempts++;
              console.log(
                `[Agentation] Reconnecting in ${RECONNECT_DELAY / 1000}s...`,
              );
              setTimeout(
                () => this.connect(this.serverUrl, true),
                RECONNECT_DELAY,
              );
            }
          };

          this.ws.onerror = () => {
            if (
              !this.silent &&
              !this.hasEverConnected &&
              this.reconnectAttempts === 0
            ) {
              console.log(
                "[Agentation] MCP server not available. Copy to Clipboard still works.",
              );
            }
            reject(new Error("Connection failed"));
          };

          this.ws.onmessage = (event) => {
            this.handleMessage(event.data);
          };
        } catch (error) {
          reject(error);
        }
      });
    }

    /**
     * Disconnect from the MCP server
     */
    disconnect() {
      this.autoReconnect = false;

      if (this.ws) {
        // Send disconnect message before closing
        this.send({
          type: "disconnect",
          timestamp: new Date().toISOString(),
        });

        this.ws.close(1000, "Client requested disconnect");
        this.ws = null;
      }

      this.connected = false;
    }

    /**
     * Check if connected
     */
    isConnected() {
      return this.connected && this.ws && this.ws.readyState === WebSocket.OPEN;
    }

    /**
     * Send a message to the server
     */
    send(message) {
      if (!this.isConnected()) {
        console.warn("[WS Client] Not connected, cannot send message");
        return false;
      }

      try {
        this.ws.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error("[WS Client] Failed to send message:", error);
        return false;
      }
    }

    /**
     * Send connect message with page info
     */
    sendConnect() {
      this.send({
        type: "connect",
        payload: {
          pageUrl: window.location.href,
          pageTitle: document.title,
        },
        timestamp: new Date().toISOString(),
      });
    }

    /**
     * Submit feedback to the MCP server
     * Returns a promise that resolves with the AI response
     */
    submitFeedback(annotations, additionalContext = "") {
      return new Promise((resolve, reject) => {
        if (!this.isConnected()) {
          reject(new Error("Not connected to MCP server"));
          return;
        }

        const requestId = `fb_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

        // Store the pending request
        this.pendingRequests.set(requestId, { resolve, reject });

        // Set timeout for the request
        setTimeout(() => {
          if (this.pendingRequests.has(requestId)) {
            this.pendingRequests.delete(requestId);
            reject(new Error("Request timeout"));
          }
        }, 120000); // 2 minute timeout for AI processing

        // Transform designTerms IDs to full prompts before sending
        const processedAnnotations = annotations.map((annotation) => {
          if (
            annotation.designTerms &&
            annotation.designTerms.length > 0 &&
            window.agentationDesignTerms
          ) {
            return {
              ...annotation,
              designTerms: annotation.designTerms.map((termId) => {
                const term = window.agentationDesignTerms.getById(termId);
                return term ? term.prompt : termId;
              }),
            };
          }
          return annotation;
        });

        // Send the feedback
        const success = this.send({
          type: "submit-feedback",
          id: requestId,
          payload: {
            pageUrl: window.location.href,
            pageTitle: document.title,
            annotations: processedAnnotations,
            additionalContext,
          },
          timestamp: new Date().toISOString(),
        });

        if (!success) {
          this.pendingRequests.delete(requestId);
          reject(new Error("Failed to send feedback"));
        }
      });
    }

    /**
     * Request status from the server
     */
    requestStatus() {
      this.send({
        type: "status",
        timestamp: new Date().toISOString(),
      });
    }

    /**
     * Handle incoming messages
     */
    handleMessage(data) {
      try {
        const message = JSON.parse(data);
        console.log("[WS Client] Received:", message.type);

        switch (message.type) {
          case "status":
            if (this.onStatusChange) {
              this.onStatusChange(message.payload);
            }
            break;

          case "feedback-result":
            this.handleFeedbackResult(message);
            break;

          case "error":
            console.error("[WS Client] Server error:", message.payload);
            this.handleError(message);
            break;

          default:
            // Call registered handler if any
            const handler = this.messageHandlers.get(message.type);
            if (handler) {
              handler(message);
            }
        }
      } catch (error) {
        console.error("[WS Client] Failed to parse message:", error);
      }
    }

    /**
     * Handle feedback result
     */
    handleFeedbackResult(message) {
      const {
        requestId,
        success,
        message: errorMessage,
        response,
      } = message.payload;

      const pending = this.pendingRequests.get(requestId);
      if (pending) {
        this.pendingRequests.delete(requestId);

        if (success) {
          pending.resolve(response);
        } else {
          pending.reject(
            new Error(errorMessage || "Feedback processing failed"),
          );
        }
      }

      // Also call the general callback if set
      if (this.onFeedbackResult) {
        this.onFeedbackResult(message.payload);
      }
    }

    /**
     * Handle error messages
     */
    handleError(message) {
      const { code } = message.payload;

      // Reject all pending requests on certain errors
      if (code === "CONNECTION_FAILED" || code === "SERVER_ERROR") {
        for (const [id, pending] of this.pendingRequests) {
          pending.reject(new Error(message.payload.message));
        }
        this.pendingRequests.clear();
      }
    }

    /**
     * Register a message handler for a specific type
     */
    on(type, handler) {
      this.messageHandlers.set(type, handler);
    }

    /**
     * Remove a message handler
     */
    off(type) {
      this.messageHandlers.delete(type);
    }
  }

  // Export to window for content script access
  window.AgentationWebSocketClient = AgentationWebSocketClient;

  // Create a singleton instance
  window.agentationWS = new AgentationWebSocketClient();
})();
