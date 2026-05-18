import type { ProtocolExecutionResult, ProtocolMessage, ResponseState } from '../types';

export interface WebSocketRequestOptions {
  url: string;
  headers?: Record<string, string>;
  initialMessage?: string;
}

export interface WebSocketHandlers {
  onOpen: () => void;
  onMessage: (message: ProtocolMessage) => void;
  onError: (message: string) => void;
  onClose: (code?: number, reason?: string) => void;
}

function createMessage(
  direction: ProtocolMessage['direction'],
  data: string,
  meta?: Record<string, string>,
): ProtocolMessage {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    direction,
    timestamp: Date.now(),
    data,
    meta,
  };
}

function stringifyWebSocketData(data: unknown): string {
  if (typeof data === 'string') return data;
  if (data instanceof ArrayBuffer) return new TextDecoder().decode(data);
  if (data instanceof Blob) return '[Blob message]';
  return String(data);
}

export function createProtocolMessage(
  direction: ProtocolMessage['direction'],
  data: string,
  meta?: Record<string, string>,
): ProtocolMessage {
  return createMessage(direction, data, meta);
}

export function connectWebSocket(
  options: WebSocketRequestOptions,
  handlers: WebSocketHandlers,
): ProtocolExecutionResult {
  const startedAt = Date.now();
  const response: ResponseState = {
    mode: 'websocket',
    status: 0,
    statusText: 'CONNECTING',
    body: '(connecting)',
    headers: {},
    time: 0,
    isStreaming: true,
    streamStartedAt: startedAt,
    streamEventCount: 0,
    messages: [createMessage('system', `Connecting to ${options.url}`)],
  };

  const socket = new WebSocket(options.url);

  socket.addEventListener('open', () => {
    handlers.onOpen();
    if (options.initialMessage?.trim()) {
      socket.send(options.initialMessage);
    }
  });

  socket.addEventListener('message', (event) => {
    handlers.onMessage(createMessage('inbound', stringifyWebSocketData(event.data)));
  });

  socket.addEventListener('error', () => {
    handlers.onError('WebSocket connection error');
  });

  socket.addEventListener('close', (event) => {
    handlers.onClose(event.code, event.reason);
  });

  return {
    protocol: 'websocket',
    response,
    controller: {
      send(message: string) {
        socket.send(message);
      },
      disconnect() {
        socket.close();
      },
    },
  };
}
