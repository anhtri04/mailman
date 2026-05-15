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

export interface ResponseState {
  status: number;
  statusText: string;
  body: string;
  headers: Record<string, string>;
  time: number;
  mode?: 'single' | 'sse';
  isStreaming?: boolean;
  streamStartedAt?: number;
  streamEndedAt?: number;
  streamEventCount?: number;
  sseEvents?: SSEEvent[];
  sseMeta?: SSEMeta;
}
