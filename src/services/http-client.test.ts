import { test, expect, describe, beforeEach, afterEach } from 'bun:test';
import { sendRequest, sendRequestWithStreaming } from './http-client';
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

    test('should apply bearer token auth to headers', async () => {
      let capturedInit: RequestInit | undefined;
      const mockResponse = new Response('{}', { status: 200, statusText: 'OK' });

      globalThis.fetch = ((url: string | URL | Request, init?: RequestInit) => {
        capturedInit = init;
        return Promise.resolve(mockResponse);
      }) as unknown as typeof fetch;

      const options: RequestOptions = {
        method: 'GET',
        url: 'https://example.com/api',
        auth: {
          type: 'bearer',
          token: 'my-secret-token-123',
        },
      };

      await sendRequest(options);

      expect(capturedInit?.headers).toEqual({
        Authorization: 'Bearer my-secret-token-123',
      });
    });

    test('should apply API key auth to headers by default', async () => {
      let capturedInit: RequestInit | undefined;
      const mockResponse = new Response('{}', { status: 200, statusText: 'OK' });

      globalThis.fetch = ((url: string | URL | Request, init?: RequestInit) => {
        capturedInit = init;
        return Promise.resolve(mockResponse);
      }) as unknown as typeof fetch;

      const options: RequestOptions = {
        method: 'GET',
        url: 'https://example.com/api',
        auth: {
          type: 'api-key',
          key: 'X-API-Key',
          value: 'secret-api-key',
          location: 'header',
        },
      };

      await sendRequest(options);

      expect(capturedInit?.headers).toEqual({
        'X-API-Key': 'secret-api-key',
      });
    });

    test('should apply API key auth to query string', async () => {
      let capturedUrl: string | undefined;
      const mockResponse = new Response('{}', { status: 200, statusText: 'OK' });

      globalThis.fetch = ((url: string | URL | Request) => {
        capturedUrl = url.toString();
        return Promise.resolve(mockResponse);
      }) as unknown as typeof fetch;

      const options: RequestOptions = {
        method: 'GET',
        url: 'https://example.com/api',
        auth: {
          type: 'api-key',
          key: 'api_key',
          value: 'my-api-key',
          location: 'query',
        },
      };

      await sendRequest(options);

      expect(capturedUrl).toBe('https://example.com/api?api_key=my-api-key');
    });

    test('should append API key to existing query string', async () => {
      let capturedUrl: string | undefined;
      const mockResponse = new Response('{}', { status: 200, statusText: 'OK' });

      globalThis.fetch = ((url: string | URL | Request) => {
        capturedUrl = url.toString();
        return Promise.resolve(mockResponse);
      }) as unknown as typeof fetch;

      const options: RequestOptions = {
        method: 'GET',
        url: 'https://example.com/api?limit=10',
        auth: {
          type: 'api-key',
          key: 'token',
          value: 'abc123',
          location: 'query',
        },
      };

      await sendRequest(options);

      expect(capturedUrl).toBe('https://example.com/api?limit=10&token=abc123');
    });

    test('should not apply auth when type is none', async () => {
      let capturedInit: RequestInit | undefined;
      const mockResponse = new Response('{}', { status: 200, statusText: 'OK' });

      globalThis.fetch = ((url: string | URL | Request, init?: RequestInit) => {
        capturedInit = init;
        return Promise.resolve(mockResponse);
      }) as unknown as typeof fetch;

      const options: RequestOptions = {
        method: 'GET',
        url: 'https://example.com/api',
        auth: {
          type: 'none',
        },
      };

      await sendRequest(options);

      expect(capturedInit?.headers).toEqual({});
    });

    test('should combine auth headers with existing headers', async () => {
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
          'Content-Type': 'application/json',
        },
        auth: {
          type: 'bearer',
          token: 'my-token',
        },
      };

      await sendRequest(options);

      expect(capturedInit?.headers).toEqual({
        'Content-Type': 'application/json',
        Authorization: 'Bearer my-token',
      });
    });

    test('should not apply bearer auth when token is empty', async () => {
      let capturedInit: RequestInit | undefined;
      const mockResponse = new Response('{}', { status: 200, statusText: 'OK' });

      globalThis.fetch = ((url: string | URL | Request, init?: RequestInit) => {
        capturedInit = init;
        return Promise.resolve(mockResponse);
      }) as unknown as typeof fetch;

      const options: RequestOptions = {
        method: 'GET',
        url: 'https://example.com/api',
        auth: {
          type: 'bearer',
          token: '',
        },
      };

      await sendRequest(options);

      expect(capturedInit?.headers).toEqual({});
    });

    test('should URL-encode API key values in query string', async () => {
      let capturedUrl: string | undefined;
      const mockResponse = new Response('{}', { status: 200, statusText: 'OK' });

      globalThis.fetch = ((url: string | URL | Request) => {
        capturedUrl = url.toString();
        return Promise.resolve(mockResponse);
      }) as unknown as typeof fetch;

      const options: RequestOptions = {
        method: 'GET',
        url: 'https://example.com/api',
        auth: {
          type: 'api-key',
          key: 'token',
          value: 'hello world & more=special',
          location: 'query',
        },
      };

      await sendRequest(options);

      expect(capturedUrl).toBe(
        'https://example.com/api?token=hello%20world%20%26%20more%3Dspecial',
      );
    });

    test('should apply basic auth header', async () => {
      let capturedInit: RequestInit | undefined;
      const mockResponse = new Response('{}', { status: 200, statusText: 'OK' });

      globalThis.fetch = ((url: string | URL | Request, init?: RequestInit) => {
        capturedInit = init;
        return Promise.resolve(mockResponse);
      }) as unknown as typeof fetch;

      await sendRequest({
        method: 'GET',
        url: 'https://example.com/api',
        auth: {
          type: 'basic',
          username: 'alice',
          password: 'secret',
        },
      });

      expect(capturedInit?.headers).toEqual({
        Authorization: 'Basic YWxpY2U6c2VjcmV0',
      });
    });

    test('should refresh oauth2 access token before request', async () => {
      const calls: Array<{ url: string; init?: RequestInit }> = [];
      globalThis.fetch = ((url: string | URL | Request, init?: RequestInit) => {
        calls.push({ url: url.toString(), init });

        if (calls.length === 1) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                access_token: 'new-access',
                refresh_token: 'new-refresh',
                expires_in: 3600,
                token_type: 'Bearer',
              }),
              { status: 200, statusText: 'OK' },
            ),
          );
        }

        return Promise.resolve(new Response('{"ok":true}', { status: 200, statusText: 'OK' }));
      }) as unknown as typeof fetch;

      const result = await sendRequest({
        method: 'GET',
        url: 'https://example.com/data',
        auth: {
          type: 'oauth2',
          oauth2: {
            grantType: 'client_credentials',
            tokenUrl: 'https://auth.example.com/token',
            clientId: 'client-id',
            refreshToken: 'old-refresh',
            accessToken: 'old-access',
            expiresAt: Date.now() - 1000,
          },
        },
      });

      expect(calls[0]?.url).toBe('https://auth.example.com/token');
      expect(calls[1]?.url).toBe('https://example.com/data');
      expect(calls[1]?.init?.headers).toEqual({ Authorization: 'Bearer new-access' });
      expect(result.updatedAuth?.oauth2?.accessToken).toBe('new-access');
      expect(result.updatedAuth?.oauth2?.refreshToken).toBe('new-refresh');
    });
  });

  describe('sendRequestWithStreaming', () => {
    test('should expose streaming API for REST requests', async () => {
      const options: RequestOptions = {
        method: 'GET',
        url: 'https://example.com/sse',
      };

      const events: string[] = [];
      await sendRequestWithStreaming(options, {
        onOpen: () => {
          events.push('open');
        },
        onEvent: () => {
          events.push('event');
        },
      });

      expect(events.length).toBeGreaterThanOrEqual(1);
    });
  });
});
