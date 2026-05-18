import { afterEach, describe, expect, test } from 'bun:test';
import { connectWebSocket, createProtocolMessage } from './websocket-client';
import type { ProtocolMessage } from '../types';

type Listener = (event: Record<string, unknown>) => void;

class MockWebSocket {
  static instances: MockWebSocket[] = [];

  readonly url: string;
  readonly sent: string[] = [];
  private readonly listeners = new Map<string, Listener[]>();

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  addEventListener(event: string, listener: Listener): void {
    const listeners = this.listeners.get(event) ?? [];
    listeners.push(listener);
    this.listeners.set(event, listeners);
  }

  send(message: string): void {
    this.sent.push(message);
  }

  close(): void {
    this.emit('close', { code: 1000, reason: 'normal' });
  }

  emit(event: string, payload: Record<string, unknown> = {}): void {
    for (const listener of this.listeners.get(event) ?? []) {
      listener(payload);
    }
  }
}

describe('websocket-client', () => {
  const originalWebSocket = globalThis.WebSocket;

  afterEach(() => {
    globalThis.WebSocket = originalWebSocket;
    MockWebSocket.instances = [];
  });

  test('connectWebSocket creates a websocket response and controller', () => {
    globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket;

    const result = connectWebSocket(
      { url: 'wss://example.com/socket', initialMessage: 'hello' },
      {
        onOpen: () => {},
        onMessage: () => {},
        onError: () => {},
        onClose: () => {},
      },
    );

    expect(result.protocol).toBe('websocket');
    expect(result.response.mode).toBe('websocket');
    expect(result.response.statusText).toBe('CONNECTING');
    expect(result.response.isStreaming).toBe(true);
    expect(result.response.messages?.[0]?.data).toBe('Connecting to wss://example.com/socket');
    expect(result.controller?.send).toBeDefined();
    expect(MockWebSocket.instances[0]?.url).toBe('wss://example.com/socket');
  });

  test('sends initial message after open event', () => {
    globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket;
    let opened = false;

    connectWebSocket(
      { url: 'wss://example.com/socket', initialMessage: 'hello' },
      {
        onOpen: () => {
          opened = true;
        },
        onMessage: () => {},
        onError: () => {},
        onClose: () => {},
      },
    );

    const socket = MockWebSocket.instances[0];
    socket?.emit('open');

    expect(opened).toBe(true);
    expect(socket?.sent).toEqual(['hello']);
  });

  test('normalizes inbound message events', () => {
    globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket;
    const messages: ProtocolMessage[] = [];

    connectWebSocket(
      { url: 'wss://example.com/socket' },
      {
        onOpen: () => {},
        onMessage: (message) => messages.push(message),
        onError: () => {},
        onClose: () => {},
      },
    );

    MockWebSocket.instances[0]?.emit('message', { data: 'server message' });

    expect(messages).toHaveLength(1);
    expect(messages[0]?.direction).toBe('inbound');
    expect(messages[0]?.data).toBe('server message');
  });

  test('controller send and disconnect delegate to the socket', () => {
    globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket;
    let closeCode: number | undefined;
    let closeReason: string | undefined;

    const result = connectWebSocket(
      { url: 'wss://example.com/socket' },
      {
        onOpen: () => {},
        onMessage: () => {},
        onError: () => {},
        onClose: (code, reason) => {
          closeCode = code;
          closeReason = reason;
        },
      },
    );

    result.controller?.send?.('client message');
    result.controller?.disconnect();

    expect(MockWebSocket.instances[0]?.sent).toEqual(['client message']);
    expect(closeCode).toBe(1000);
    expect(closeReason).toBe('normal');
  });

  test('createProtocolMessage creates timestamped protocol messages', () => {
    const message = createProtocolMessage('outbound', 'payload', { source: 'test' });

    expect(message.direction).toBe('outbound');
    expect(message.data).toBe('payload');
    expect(message.meta).toEqual({ source: 'test' });
    expect(message.id.length).toBeGreaterThan(0);
    expect(message.timestamp).toBeGreaterThan(0);
  });
});
