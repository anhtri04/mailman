import { test, expect, describe, beforeEach, afterEach } from 'bun:test';
import { sendRequest } from './http-client';
import type { RequestOptions } from '../types';

describe('http-client', () => {
  let originalFetch: typeof fetch;
  const mockFetch = () => {
    const mockFn = (() => Promise.resolve(new Response('{}'))) as unknown as typeof fetch;
    return Object.assign(mockFn, {
      preconnect: () => Promise.resolve(),
    }) as typeof fetch;
  };

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('sendRequest', () => {
    test('should make GET request successfully', async () => {
      const mockResponse = new Response('{"message": "Hello"}', {
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
      });

      globalThis.fetch = (() => Promise.resolve(mockResponse)) as unknown as typeof fetch;

      const options: RequestOptions = {
        method: 'GET',
        url: 'https://example.com/api',
      };

      const result = await sendRequest(options);

      expect(result.status).toBe(200);
      expect(result.statusText).toBe('OK');
      expect(result.body).toBe('{"message": "Hello"}');
      expect(result.headers['content-type']).toBe('application/json');
      expect(result.time).toBeGreaterThanOrEqual(0);
    });

    test('should support POST method with body', async () => {
      let capturedInit: RequestInit | undefined;
      const mockResponse = new Response('{"id": 123}', {
        status: 201,
        statusText: 'Created',
      });

      globalThis.fetch = ((url: string | URL | Request, init?: RequestInit) => {
        capturedInit = init;
        return Promise.resolve(mockResponse);
      }) as unknown as typeof fetch;

      const options: RequestOptions = {
        method: 'POST',
        url: 'https://example.com/api/users',
        headers: { 'Content-Type': 'application/json' },
        body: '{"name": "John"}',
      };

      await sendRequest(options);

      expect(capturedInit?.method).toBe('POST');
      expect(capturedInit?.body).toBe('{"name": "John"}');
    });

    test('should support PUT method with body', async () => {
      let capturedInit: RequestInit | undefined;
      const mockResponse = new Response('{}', { status: 200, statusText: 'OK' });

      globalThis.fetch = ((url: string | URL | Request, init?: RequestInit) => {
        capturedInit = init;
        return Promise.resolve(mockResponse);
      }) as unknown as typeof fetch;

      const options: RequestOptions = {
        method: 'PUT',
        url: 'https://example.com/api/users/1',
        body: '{"name": "Updated"}',
      };

      await sendRequest(options);

      expect(capturedInit?.method).toBe('PUT');
      expect(capturedInit?.body).toBe('{"name": "Updated"}');
    });

    test('should support DELETE method', async () => {
      let capturedInit: RequestInit | undefined;
      const mockResponse = new Response('', {
        status: 204,
        statusText: 'No Content',
      });

      globalThis.fetch = ((url: string | URL | Request, init?: RequestInit) => {
        capturedInit = init;
        return Promise.resolve(mockResponse);
      }) as unknown as typeof fetch;

      const options: RequestOptions = {
        method: 'DELETE',
        url: 'https://example.com/api/users/1',
      };

      await sendRequest(options);

      expect(capturedInit?.method).toBe('DELETE');
    });

    test('should support PATCH method with body', async () => {
      let capturedInit: RequestInit | undefined;
      const mockResponse = new Response('{}', { status: 200, statusText: 'OK' });

      globalThis.fetch = ((url: string | URL | Request, init?: RequestInit) => {
        capturedInit = init;
        return Promise.resolve(mockResponse);
      }) as unknown as typeof fetch;

      const options: RequestOptions = {
        method: 'PATCH',
        url: 'https://example.com/api/users/1',
        body: '{"name": "Patched"}',
      };

      await sendRequest(options);

      expect(capturedInit?.method).toBe('PATCH');
      expect(capturedInit?.body).toBe('{"name": "Patched"}');
    });

    test('should not include body for GET requests', async () => {
      let capturedInit: RequestInit | undefined;
      const mockResponse = new Response('{}', { status: 200, statusText: 'OK' });

      globalThis.fetch = ((url: string | URL | Request, init?: RequestInit) => {
        capturedInit = init;
        return Promise.resolve(mockResponse);
      }) as unknown as typeof fetch;

      const options: RequestOptions = {
        method: 'GET',
        url: 'https://example.com/api',
        body: 'should-be-ignored',
      };

      await sendRequest(options);

      expect(capturedInit?.body).toBeUndefined();
    });

    test('should handle empty response body', async () => {
      const mockResponse = new Response('', {
        status: 204,
        statusText: 'No Content',
      });

      globalThis.fetch = (() => Promise.resolve(mockResponse)) as unknown as typeof fetch;

      const options: RequestOptions = {
        method: 'DELETE',
        url: 'https://example.com/api',
      };

      const result = await sendRequest(options);

      expect(result.body).toBe('(empty response)');
    });

    test('should handle 4xx client errors', async () => {
      const mockResponse = new Response('{"error": "Resource not found"}', {
        status: 404,
        statusText: 'Not Found',
        headers: { 'content-type': 'application/json' },
      });

      globalThis.fetch = (() => Promise.resolve(mockResponse)) as unknown as typeof fetch;

      const options: RequestOptions = {
        method: 'GET',
        url: 'https://example.com/api/missing',
      };

      const result = await sendRequest(options);

      expect(result.status).toBe(404);
      expect(result.statusText).toBe('Not Found');
      expect(result.body).toBe('{"error": "Resource not found"}');
    });

    test('should handle 5xx server errors', async () => {
      const mockResponse = new Response('Server error', {
        status: 500,
        statusText: 'Internal Server Error',
      });

      globalThis.fetch = (() => Promise.resolve(mockResponse)) as unknown as typeof fetch;

      const options: RequestOptions = {
        method: 'GET',
        url: 'https://example.com/api/error',
      };

      const result = await sendRequest(options);

      expect(result.status).toBe(500);
      expect(result.statusText).toBe('Internal Server Error');
    });

    test('should handle DNS lookup failures', async () => {
      const dnsError = new Error('getaddrinfo ENOTFOUND invalid.domain');
      globalThis.fetch = (() => Promise.reject(dnsError)) as unknown as typeof fetch;

      const options: RequestOptions = {
        method: 'GET',
        url: 'https://invalid.domain',
      };

      const result = await sendRequest(options);

      expect(result.status).toBe(0);
      expect(result.statusText).toBe('DNS');
      expect(result.body).toBe('Error: DNS lookup failed - check the URL');
      expect(result.time).toBeGreaterThanOrEqual(0);
    });

    test('should handle network errors', async () => {
      const networkError = new Error('Network request failed');
      globalThis.fetch = (() => Promise.reject(networkError)) as unknown as typeof fetch;

      const options: RequestOptions = {
        method: 'GET',
        url: 'https://example.com',
      };

      const result = await sendRequest(options);

      expect(result.status).toBe(0);
      expect(result.statusText).toBe('NETWORK');
      expect(result.body).toBe('Error: Network error - check your connection');
    });

    test('should handle connection refused', async () => {
      const connError = new Error('connect ECONNREFUSED');
      globalThis.fetch = (() => Promise.reject(connError)) as unknown as typeof fetch;

      const options: RequestOptions = {
        method: 'GET',
        url: 'http://localhost:9999',
      };

      const result = await sendRequest(options);

      expect(result.status).toBe(0);
      expect(result.body).toContain('Network error');
    });

    test('should handle timeout', async () => {
      const timeoutError = new Error('The operation was aborted');
      globalThis.fetch = (() => Promise.reject(timeoutError)) as unknown as typeof fetch;

      const options: RequestOptions = {
        method: 'GET',
        url: 'https://example.com/slow',
      };

      const result = await sendRequest(options, 100);

      expect(result.status).toBe(0);
      expect(result.statusText).toBe('TIMEOUT');
      expect(result.body).toBe('Error: Request timed out');
    });

    test('should pass custom headers', async () => {
      let capturedInit: RequestInit | undefined;
      const mockResponse = new Response('{}', { status: 200, statusText: 'OK' });

      globalThis.fetch = ((url: string | URL | Request, init?: RequestInit) => {
        capturedInit = init;
        return Promise.resolve(mockResponse);
      }) as unknown as typeof fetch;

      const options: RequestOptions = {
        method: 'GET',
        url: 'https://example.com/api',
        headers: {
          Authorization: 'Bearer token123',
          'X-Custom-Header': 'custom-value',
        },
      };

      await sendRequest(options);

      expect(capturedInit?.headers).toEqual({
        Authorization: 'Bearer token123',
        'X-Custom-Header': 'custom-value',
      });
    });

    test('should measure response time accurately', async () => {
      const mockResponse = new Promise<Response>((resolve) => {
        setTimeout(() => {
          resolve(new Response('{}', { status: 200, statusText: 'OK' }));
        }, 50);
      });

      globalThis.fetch = (() => mockResponse) as unknown as typeof fetch;

      const options: RequestOptions = {
        method: 'GET',
        url: 'https://example.com',
      };

      const result = await sendRequest(options);

      expect(result.time).toBeGreaterThanOrEqual(50);
    });

    test('should handle unknown errors gracefully', async () => {
      const unknownError = new Error('Something unexpected happened');
      globalThis.fetch = (() => Promise.reject(unknownError)) as unknown as typeof fetch;

      const options: RequestOptions = {
        method: 'GET',
        url: 'https://example.com',
      };

      const result = await sendRequest(options);

      expect(result.status).toBe(0);
      expect(result.statusText).toBe('UNKNOWN');
      expect(result.body).toBe('Error: Something unexpected happened');
    });

    test('should handle non-Error exceptions', async () => {
      globalThis.fetch = (() => Promise.reject('String error')) as unknown as typeof fetch;

      const options: RequestOptions = {
        method: 'GET',
        url: 'https://example.com',
      };

      const result = await sendRequest(options);

      expect(result.status).toBe(0);
      expect(result.body).toBe('Error: An unexpected error occurred');
    });

    test('should return all response headers', async () => {
      const mockResponse = new Response('{}', {
        status: 200,
        statusText: 'OK',
        headers: {
          'content-type': 'application/json',
          'x-custom': 'value',
          'cache-control': 'no-cache',
        },
      });

      globalThis.fetch = (() => Promise.resolve(mockResponse)) as unknown as typeof fetch;

      const options: RequestOptions = {
        method: 'GET',
        url: 'https://example.com',
      };

      const result = await sendRequest(options);

      expect(Object.keys(result.headers).length).toBe(3);
      expect(result.headers['content-type']).toBe('application/json');
      expect(result.headers['x-custom']).toBe('value');
      expect(result.headers['cache-control']).toBe('no-cache');
    });
  });
});
