/**
 * Agentation Shared Types
 * Common types used across extension, MCP server, and OpenCode integration
 */

// ============================================================================
// Annotation Types (from Extension)
// ============================================================================

export interface Position {
  top: number;
  left: number;
}

export interface BoundingBox extends Position {
  width: number;
  height: number;
}

export interface SingleAnnotation {
  id: number;
  isGroup?: false;
  selector: string;
  description: string;
  feedback: string;
  position: Position;
  timestamp: string;
}

export interface GroupAnnotation {
  id: number;
  isGroup: true;
  selectors: string[];
  descriptions: string[];
  feedback: string;
  position: Position;
  boundingBox: BoundingBox;
  timestamp: string;
}

export type Annotation = SingleAnnotation | GroupAnnotation;

// ============================================================================
// WebSocket Message Types (Extension <-> MCP Server)
// ============================================================================

export type WebSocketMessageType =
  | "connect"
  | "disconnect"
  | "submit-feedback"
  | "feedback-result"
  | "status"
  | "error";

export interface WebSocketMessage<T = unknown> {
  type: WebSocketMessageType;
  id?: string;
  payload?: T;
  timestamp: string;
}

export interface ConnectPayload {
  pageUrl: string;
  pageTitle: string;
}

export interface SubmitFeedbackPayload {
  pageUrl: string;
  pageTitle: string;
  annotations: Annotation[];
  additionalContext?: string;
}

export interface FeedbackResultPayload {
  requestId: string;
  success: boolean;
  message?: string;
  response?: string;
}

export interface StatusPayload {
  connected: boolean;
  mcpConnected: boolean;
  samplingSupported: boolean;
}

export interface ErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

// ============================================================================
// MCP Sampling Types
// ============================================================================

export interface SamplingTrustLevel {
  mode: "auto" | "prompt" | "deny";
  maxTokens?: number;
  dailyLimit?: number;
}

export interface SamplingConfig {
  trustLevels: Record<string, SamplingTrustLevel>;
  defaultTrustLevel: SamplingTrustLevel;
  globalDailyLimit?: number;
}

export interface SamplingRequest {
  serverId: string;
  serverName: string;
  messages: SamplingMessage[];
  systemPrompt?: string;
  maxTokens?: number;
  modelPreferences?: ModelPreferences;
}

export interface SamplingMessage {
  role: "user" | "assistant";
  content: SamplingContent;
}

export type SamplingContent =
  | { type: "text"; text: string }
  | { type: "image"; data: string; mimeType: string }
  | { type: "audio"; data: string; mimeType: string };

export interface ModelPreferences {
  hints?: { name: string }[];
  costPriority?: number;
  speedPriority?: number;
  intelligencePriority?: number;
}

export interface SamplingResponse {
  role: "assistant";
  content: SamplingContent;
  model: string;
  stopReason?: string;
}

// ============================================================================
// Extension Settings
// ============================================================================

export interface ExtensionSettings {
  outputDetail: "standard" | "detailed";
  markerColor: string;
  blockInteractions: boolean;
  mcpServerUrl?: string;
  autoConnect?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

export const DEFAULT_MCP_SERVER_PORT = 19989;
export const DEFAULT_WEBSOCKET_URL = `ws://localhost:${DEFAULT_MCP_SERVER_PORT}`;

export const ERROR_CODES = {
  CONNECTION_FAILED: "CONNECTION_FAILED",
  SAMPLING_DENIED: "SAMPLING_DENIED",
  SAMPLING_TIMEOUT: "SAMPLING_TIMEOUT",
  INVALID_MESSAGE: "INVALID_MESSAGE",
  SERVER_ERROR: "SERVER_ERROR",
} as const;
