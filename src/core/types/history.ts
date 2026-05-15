import type { AuthConfig } from './auth';
import type { Protocol } from './collections';

export interface HistorySSESummary {
  eventCount: number;
  droppedEvents: number;
  durationMs: number;
}

export interface HistoryRequestSnapshot {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
  variables?: string;
  auth?: AuthConfig;
}

export interface HistoryResponseSnapshot {
  status: number;
  statusText: string;
  body: string;
  headers: Record<string, string>;
  time: number;
  mode?: 'single' | 'sse';
  sseSummary?: HistorySSESummary;
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
