import type { AuthConfig } from './auth';
import type { Protocol } from './collections';
import type { RequestStats } from './request-stats';
import type { RequestScripts, ScriptExecutionSummary } from './scripts';

export interface HistorySSESummary {
  eventCount: number;
  droppedEvents: number;
  durationMs: number;
}

export interface HistoryMessageSummary {
  messageCount: number;
  durationMs: number;
}

export interface HistoryRequestSnapshot {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
  variables?: string;
  auth?: AuthConfig;
  scripts?: RequestScripts;
}

export interface HistoryResponseSnapshot {
  status: number;
  statusText: string;
  body: string;
  headers: Record<string, string>;
  time: number;
  stats?: RequestStats;
  mode?: 'single' | 'sse' | 'websocket';
  sseSummary?: HistorySSESummary;
  messageSummary?: HistoryMessageSummary;
  scriptResults?: ScriptExecutionSummary;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  protocol: Protocol;
  collectionId?: string;
  requestId?: string;
  requestName?: string;
  request: HistoryRequestSnapshot;
  response: HistoryResponseSnapshot;
}

export type HistoryEntryInput = Omit<HistoryEntry, 'id' | 'timestamp'>;
