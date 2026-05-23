import type { AuthConfig } from './auth';
import type { Protocol } from './collections';
import type { RequestStats } from './request-stats';
import type { ScriptExecutionSummary } from './scripts';

export interface ProtocolMessage {
  id: string;
  direction: 'inbound' | 'outbound' | 'system';
  timestamp: number;
  data: string;
  event?: string;
  meta?: Record<string, string>;
}

export interface SSEEvent {
  id?: string;
  event?: string;
  data: string;
  retry?: number;
  timestamp: number;
  raw?: string;
}

export interface SSEMeta {
  lastEventId?: string;
  retryMs?: number;
  droppedEvents?: number;
}

export type ResponseMode = 'single' | 'sse' | 'websocket';

export interface ResponseState {
  mode?: ResponseMode;
  status: number;
  statusText: string;
  body: string;
  headers: Record<string, string>;
  time: number;
  stats?: RequestStats;
  isStreaming?: boolean;
  streamStartedAt?: number;
  streamEndedAt?: number;
  streamEventCount?: number;
  streamSessionId?: string;
  messages?: ProtocolMessage[];
  sseEvents?: SSEEvent[];
  sseMeta?: SSEMeta;
  scriptResults?: ScriptExecutionSummary;
}

export interface ProtocolController {
  disconnect(): void;
  send?(message: string): void;
}

export interface ProtocolExecutionResult {
  protocol: Protocol;
  response: ResponseState;
  controller?: ProtocolController;
  updatedAuth?: AuthConfig;
}
