import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import {
  classifyError,
  executeHttpRequest,
  executeHttpStreamRequest,
  resolveAuthToRequest,
} from './http-shared';
import type { ResponseState, SSEEvent } from '../types';

function bytes(value: string): number {
  return new TextEncoder().encode(value).length;
}

describe('http-shared', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('classifyError', () => {
    test('classifies known operational error types', () => {
      expect(classifyError(new Error('AbortError: timeout')).type).toBe('timeout');
      expect(classifyError(new Error('getaddrinfo ENOTFOUND example.test')).type).toBe('dns');
      expect(classifyError(new Error('ECONNREFUSED socket')).type).toBe('network');
      expect(classifyError(new Error('boom')).type).toBe('unknown');
      expect(classifyError('boom').message).toBe('An unexpected error occurred');
    });
  });

  describe('resolveAuthToRequest', () => {
    test('applies API key query auth while preserving existing query params', async () => {
      const resolved = await resolveAuthToRequest({
        url: 'https://example.com/users?page=1',
        headers: { Accept: 'application/json' },
        auth: {
          type: 'api-key',
          key: 'token',
          value: 'abc 123',
          location: 'query',
        },
      });

      expect(resolved.url).toBe('https://example.com/users?page=1&token=abc%20123');
      expect(resolved.headers).toEqual({ Accept: 'application/json' });
    });
  });

  describe('executeHttpRequest', () => {
    test('returns response stats for successful requests', async () => {
      globalThis.fetch = ((url: string | URL | Request, init?: RequestInit) => {
        expect(String(url)).toBe('https://example.com/api');
        expect(init?.method).toBe('POST');
        return Promise.resolve(
          new Response('{"ok":true}', {
            status: 201,
            statusText: 'Created',
            headers: {
              'content-type': 'application/json',
              'content-length': '11',
            },
          }),
        );
      }) as unknown as typeof fetch;

      const result = await executeHttpRequest({
        url: 'https://example.com/api',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"name":"Ada"}',
      });

      expect(result.status).toBe(201);
      expect(result.body).toBe('{"ok":true}');
      expect(result.stats.timings.totalMs).toBe(result.time);
      expect(result.stats.timings.ttfbMs).toBeGreaterThanOrEqual(0);
      expect(result.stats.timings.downloadMs).toBeGreaterThanOrEqual(0);
      expect(result.stats.requestSize.bodyBytes).toBe(bytes('{"name":"Ada"}'));
      expect(result.stats.responseSize.bodyBytes).toBe(bytes('{"ok":true}'));
      expect(result.stats.responseSize.contentLengthHeader).toBe(11);
      expect(result.stats.network).toMatchObject({
        url: 'https://example.com/api',
        protocol: 'https:',
        host: 'example.com',
        redirected: false,
      });
    });

    test('returns response-shaped errors with stats', async () => {
      globalThis.fetch = (() =>
        Promise.reject(new Error('getaddrinfo ENOTFOUND missing.test'))) as unknown as typeof fetch;

      const result = await executeHttpRequest({
        url: 'https://missing.test',
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      expect(result.status).toBe(0);
      expect(result.statusText).toBe('DNS');
      expect(result.body).toBe('Error: DNS lookup failed - check the URL');
      expect(result.stats.network.errorType).toBe('dns');
      expect(result.stats.requestSize.headersBytes).toBeGreaterThan(0);
      expect(result.stats.responseSize.bodyBytes).toBe(bytes(result.body));
      expect(result.stats.timings.totalMs).toBe(result.time);
    });
  });

  describe('executeHttpStreamRequest', () => {
    test('returns stats for non-SSE streaming API responses', async () => {
      let opened: Pick<
        ResponseState,
        'status' | 'statusText' | 'headers' | 'time' | 'stats'
      > | null = null;

      globalThis.fetch = (() =>
        Promise.resolve(
          new Response('plain response', {
            status: 200,
            statusText: 'OK',
            headers: { 'content-type': 'text/plain' },
          }),
        )) as unknown as typeof fetch;

      const result = await executeHttpStreamRequest(
        {
          url: 'https://example.com/plain',
          method: 'GET',
          headers: {},
        },
        {
          onOpen: (initial) => {
            opened = initial;
          },
          onEvent: () => {},
        },
      );

      expect(opened?.status).toBe(200);
      expect(opened?.stats?.timings.ttfbMs).toBeGreaterThanOrEqual(0);
      expect(result.response.mode).toBe('single');
      expect(result.response.body).toBe('plain response');
      expect(result.response.stats?.responseSize.bodyBytes).toBe(bytes('plain response'));
      expect(result.response.stats?.timings.downloadMs).toBeGreaterThanOrEqual(0);
    });

    test('parses SSE events and returns final stream stats', async () => {
      const events: SSEEvent[] = [];
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('id: 1\nevent: note\ndata: hello\n\n'));
          controller.close();
        },
      });

      globalThis.fetch = (() =>
        Promise.resolve(
          new Response(stream, {
            status: 200,
            statusText: 'OK',
            headers: { 'content-type': 'text/event-stream' },
          }),
        )) as unknown as typeof fetch;

      const result = await executeHttpStreamRequest(
        {
          url: 'https://example.com/events',
          method: 'GET',
          headers: {},
        },
        {
          onOpen: () => {},
          onEvent: (event) => events.push(event),
        },
      );

      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({ id: '1', event: 'note', data: 'hello' });
      expect(result.response.mode).toBe('sse');
      expect(result.response.isStreaming).toBe(false);
      expect(result.response.stats?.responseSize.bodyBytes).toBe(bytes(result.response.body));
      expect(result.response.stats?.network.host).toBe('example.com');
    });
  });
});
