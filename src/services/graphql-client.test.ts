import { test, expect, describe, beforeEach, afterEach } from 'bun:test';
import { sendGraphQLRequest } from './graphql-client';
import type { GraphQLRequestOptions } from './graphql-client';

describe('graphql-client', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('sendGraphQLRequest', () => {
    test('should send a basic GraphQL query', async () => {
      let capturedInit: RequestInit | undefined;
      const mockResponse = new Response('{"data":{"users":[{"id":1,"name":"John"}]}}', {
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
      });

      globalThis.fetch = ((url: string | URL | Request, init?: RequestInit) => {
        capturedInit = init;
        return Promise.resolve(mockResponse);
      }) as unknown as typeof fetch;

      const options: GraphQLRequestOptions = {
        url: 'https://example.com/graphql',
        query: '{ users { id name } }',
      };

      const result = await sendGraphQLRequest(options);

      expect(result.status).toBe(200);
      expect(result.statusText).toBe('OK');
      expect(result.body).toBe('{"data":{"users":[{"id":1,"name":"John"}]}}');
      expect(result.headers['content-type']).toBe('application/json');
      expect(result.time).toBeGreaterThanOrEqual(0);

      expect(capturedInit?.method).toBe('POST');
      expect(capturedInit?.headers).toEqual({ 'Content-Type': 'application/json' });

      const requestBody = JSON.parse(capturedInit?.body as string);
      expect(requestBody.query).toBe('{ users { id name } }');
    });

    test('should include parsed variables in the payload', async () => {
      let capturedInit: RequestInit | undefined;
      const mockResponse = new Response('{"data":{"user":{"name":"John"}}}', {
        status: 200,
        statusText: 'OK',
      });

      globalThis.fetch = ((url: string | URL | Request, init?: RequestInit) => {
        capturedInit = init;
        return Promise.resolve(mockResponse);
      }) as unknown as typeof fetch;

      const options: GraphQLRequestOptions = {
        url: 'https://example.com/graphql',
        query: 'query GetUser($id: ID!) { user(id: $id) { name } }',
        variables: '{"id": "123"}',
      };

      await sendGraphQLRequest(options);

      const requestBody = JSON.parse(capturedInit?.body as string);
      expect(requestBody.variables).toEqual({ id: '123' });
    });

    test('should handle non-JSON variables as raw string', async () => {
      let capturedInit: RequestInit | undefined;
      const mockResponse = new Response('{}', { status: 200, statusText: 'OK' });

      globalThis.fetch = ((url: string | URL | Request, init?: RequestInit) => {
        capturedInit = init;
        return Promise.resolve(mockResponse);
      }) as unknown as typeof fetch;

      const options: GraphQLRequestOptions = {
        url: 'https://example.com/graphql',
        query: '{ items }',
        variables: 'not-valid-json',
      };

      await sendGraphQLRequest(options);

      const requestBody = JSON.parse(capturedInit?.body as string);
      expect(requestBody.variables).toBe('not-valid-json');
    });

    test('should include operation name when provided', async () => {
      let capturedInit: RequestInit | undefined;
      const mockResponse = new Response('{}', { status: 200, statusText: 'OK' });

      globalThis.fetch = ((url: string | URL | Request, init?: RequestInit) => {
        capturedInit = init;
        return Promise.resolve(mockResponse);
      }) as unknown as typeof fetch;

      const options: GraphQLRequestOptions = {
        url: 'https://example.com/graphql',
        query: 'query GetUser { user { id } } query GetPosts { posts { title } }',
        operationName: 'GetUser',
      };

      await sendGraphQLRequest(options);

      const requestBody = JSON.parse(capturedInit?.body as string);
      expect(requestBody.operationName).toBe('GetUser');
    });

    test('should merge custom headers with default Content-Type', async () => {
      let capturedInit: RequestInit | undefined;
      const mockResponse = new Response('{}', { status: 200, statusText: 'OK' });

      globalThis.fetch = ((url: string | URL | Request, init?: RequestInit) => {
        capturedInit = init;
        return Promise.resolve(mockResponse);
      }) as unknown as typeof fetch;

      const options: GraphQLRequestOptions = {
        url: 'https://example.com/graphql',
        query: '{ users { name } }',
        headers: {
          Authorization: 'Bearer custom-token',
          'X-Tenant': 'tenant-1',
        },
      };

      await sendGraphQLRequest(options);

      expect(capturedInit?.headers).toEqual({
        'Content-Type': 'application/json',
        Authorization: 'Bearer custom-token',
        'X-Tenant': 'tenant-1',
      });
    });

    test('should apply bearer token auth', async () => {
      let capturedInit: RequestInit | undefined;
      const mockResponse = new Response('{}', { status: 200, statusText: 'OK' });

      globalThis.fetch = ((url: string | URL | Request, init?: RequestInit) => {
        capturedInit = init;
        return Promise.resolve(mockResponse);
      }) as unknown as typeof fetch;

      const options: GraphQLRequestOptions = {
        url: 'https://example.com/graphql',
        query: '{ users { name } }',
        auth: {
          type: 'bearer',
          token: 'graphql-token-123',
        },
      };

      await sendGraphQLRequest(options);

      expect(capturedInit?.headers).toEqual({
        'Content-Type': 'application/json',
        Authorization: 'Bearer graphql-token-123',
      });
    });

    test('should apply API key auth to headers', async () => {
      let capturedInit: RequestInit | undefined;
      const mockResponse = new Response('{}', { status: 200, statusText: 'OK' });

      globalThis.fetch = ((url: string | URL | Request, init?: RequestInit) => {
        capturedInit = init;
        return Promise.resolve(mockResponse);
      }) as unknown as typeof fetch;

      const options: GraphQLRequestOptions = {
        url: 'https://example.com/graphql',
        query: '{ items }',
        auth: {
          type: 'api-key',
          key: 'X-API-Key',
          value: 'secret-graphql-key',
          location: 'header',
        },
      };

      await sendGraphQLRequest(options);

      expect(capturedInit?.headers).toEqual({
        'Content-Type': 'application/json',
        'X-API-Key': 'secret-graphql-key',
      });
    });

    test('should apply API key auth to query string', async () => {
      let capturedUrl: string | undefined;
      const mockResponse = new Response('{}', { status: 200, statusText: 'OK' });

      globalThis.fetch = ((url: string | URL | Request) => {
        capturedUrl = url.toString();
        return Promise.resolve(mockResponse);
      }) as unknown as typeof fetch;

      const options: GraphQLRequestOptions = {
        url: 'https://example.com/graphql',
        query: '{ items }',
        auth: {
          type: 'api-key',
          key: 'api_key',
          value: 'my-api-key',
          location: 'query',
        },
      };

      await sendGraphQLRequest(options);

      expect(capturedUrl).toBe('https://example.com/graphql?api_key=my-api-key');
    });

    test('should not apply auth when type is none', async () => {
      let capturedInit: RequestInit | undefined;
      const mockResponse = new Response('{}', { status: 200, statusText: 'OK' });

      globalThis.fetch = ((url: string | URL | Request, init?: RequestInit) => {
        capturedInit = init;
        return Promise.resolve(mockResponse);
      }) as unknown as typeof fetch;

      const options: GraphQLRequestOptions = {
        url: 'https://example.com/graphql',
        query: '{ items }',
        auth: { type: 'none' },
      };

      await sendGraphQLRequest(options);

      expect(capturedInit?.headers).toEqual({ 'Content-Type': 'application/json' });
    });

    test('should handle 4xx responses', async () => {
      const mockResponse = new Response('{"errors":[{"message":"Field unknown not found"}]}', {
        status: 400,
        statusText: 'Bad Request',
      });

      globalThis.fetch = (() => Promise.resolve(mockResponse)) as unknown as typeof fetch;

      const options: GraphQLRequestOptions = {
        url: 'https://example.com/graphql',
        query: '{ unknownField }',
      };

      const result = await sendGraphQLRequest(options);

      expect(result.status).toBe(400);
      expect(result.statusText).toBe('Bad Request');
      expect(result.body).toContain('Field unknown not found');
    });

    test('should handle 5xx responses', async () => {
      const mockResponse = new Response('Internal error', {
        status: 500,
        statusText: 'Internal Server Error',
      });

      globalThis.fetch = (() => Promise.resolve(mockResponse)) as unknown as typeof fetch;

      const options: GraphQLRequestOptions = {
        url: 'https://example.com/graphql',
        query: '{ items }',
      };

      const result = await sendGraphQLRequest(options);

      expect(result.status).toBe(500);
      expect(result.statusText).toBe('Internal Server Error');
    });

    test('should handle empty response body', async () => {
      const mockResponse = new Response('', {
        status: 204,
        statusText: 'No Content',
      });

      globalThis.fetch = (() => Promise.resolve(mockResponse)) as unknown as typeof fetch;

      const options: GraphQLRequestOptions = {
        url: 'https://example.com/graphql',
        query: '{ items }',
      };

      const result = await sendGraphQLRequest(options);

      expect(result.body).toBe('(empty response)');
    });

    test('should handle network errors', async () => {
      const networkError = new Error('Network request failed');
      globalThis.fetch = (() => Promise.reject(networkError)) as unknown as typeof fetch;

      const options: GraphQLRequestOptions = {
        url: 'https://example.com/graphql',
        query: '{ items }',
      };

      const result = await sendGraphQLRequest(options);

      expect(result.status).toBe(0);
      expect(result.statusText).toBe('NETWORK');
      expect(result.body).toBe('Error: Network error - check your connection');
    });

    test('should handle DNS lookup failures', async () => {
      const dnsError = new Error('getaddrinfo ENOTFOUND invalid.graphql.host');
      globalThis.fetch = (() => Promise.reject(dnsError)) as unknown as typeof fetch;

      const options: GraphQLRequestOptions = {
        url: 'https://invalid.graphql.host',
        query: '{ items }',
      };

      const result = await sendGraphQLRequest(options);

      expect(result.status).toBe(0);
      expect(result.statusText).toBe('DNS');
      expect(result.body).toBe('Error: DNS lookup failed - check the URL');
    });

    test('should handle timeout errors', async () => {
      const timeoutError = new Error('The operation was aborted');
      globalThis.fetch = (() => Promise.reject(timeoutError)) as unknown as typeof fetch;

      const options: GraphQLRequestOptions = {
        url: 'https://example.com/graphql',
        query: '{ items }',
      };

      const result = await sendGraphQLRequest(options, 100);

      expect(result.status).toBe(0);
      expect(result.statusText).toBe('TIMEOUT');
      expect(result.body).toBe('Error: Request timed out');
    });

    test('should handle unknown errors gracefully', async () => {
      const unknownError = new Error('Unexpected GraphQL server crash');
      globalThis.fetch = (() => Promise.reject(unknownError)) as unknown as typeof fetch;

      const options: GraphQLRequestOptions = {
        url: 'https://example.com/graphql',
        query: '{ items }',
      };

      const result = await sendGraphQLRequest(options);

      expect(result.status).toBe(0);
      expect(result.statusText).toBe('UNKNOWN');
      expect(result.body).toBe('Error: Unexpected GraphQL server crash');
    });

    test('should handle non-Error exceptions', async () => {
      globalThis.fetch = (() => Promise.reject('Connection lost')) as unknown as typeof fetch;

      const options: GraphQLRequestOptions = {
        url: 'https://example.com/graphql',
        query: '{ items }',
      };

      const result = await sendGraphQLRequest(options);

      expect(result.status).toBe(0);
      expect(result.body).toBe('Error: An unexpected error occurred');
    });

    test('should return all response headers', async () => {
      const mockResponse = new Response('{"data":{"items":[]}}', {
        status: 200,
        statusText: 'OK',
        headers: {
          'content-type': 'application/json',
          'x-graphql-cache': 'HIT',
          'x-request-id': 'abc-123',
        },
      });

      globalThis.fetch = (() => Promise.resolve(mockResponse)) as unknown as typeof fetch;

      const options: GraphQLRequestOptions = {
        url: 'https://example.com/graphql',
        query: '{ items { id } }',
      };

      const result = await sendGraphQLRequest(options);

      expect(Object.keys(result.headers).length).toBe(3);
      expect(result.headers['content-type']).toBe('application/json');
      expect(result.headers['x-graphql-cache']).toBe('HIT');
      expect(result.headers['x-request-id']).toBe('abc-123');
    });

    test('should measure response time accurately', async () => {
      const mockResponse = new Promise<Response>((resolve) => {
        setTimeout(() => {
          resolve(new Response('{"data":null}', { status: 200, statusText: 'OK' }));
        }, 50);
      });

      globalThis.fetch = (() => mockResponse) as unknown as typeof fetch;

      const options: GraphQLRequestOptions = {
        url: 'https://example.com/graphql',
        query: '{ items }',
      };

      const result = await sendGraphQLRequest(options);

      expect(result.time).toBeGreaterThanOrEqual(50);
    });

    test('should use POST method', async () => {
      let capturedInit: RequestInit | undefined;
      const mockResponse = new Response('{}', { status: 200, statusText: 'OK' });

      globalThis.fetch = ((url: string | URL | Request, init?: RequestInit) => {
        capturedInit = init;
        return Promise.resolve(mockResponse);
      }) as unknown as typeof fetch;

      const options: GraphQLRequestOptions = {
        url: 'https://example.com/graphql',
        query: '{ items }',
      };

      await sendGraphQLRequest(options);

      expect(capturedInit?.method).toBe('POST');
    });

    test('should trim whitespace from variables before parsing', async () => {
      let capturedInit: RequestInit | undefined;
      const mockResponse = new Response('{}', { status: 200, statusText: 'OK' });

      globalThis.fetch = ((url: string | URL | Request, init?: RequestInit) => {
        capturedInit = init;
        return Promise.resolve(mockResponse);
      }) as unknown as typeof fetch;

      const options: GraphQLRequestOptions = {
        url: 'https://example.com/graphql',
        query: '{ items }',
        variables: '   {"id": "1"}   ',
      };

      await sendGraphQLRequest(options);

      const requestBody = JSON.parse(capturedInit?.body as string);
      expect(requestBody.variables).toEqual({ id: '1' });
    });

    test('should trim operation name', async () => {
      let capturedInit: RequestInit | undefined;
      const mockResponse = new Response('{}', { status: 200, statusText: 'OK' });

      globalThis.fetch = ((url: string | URL | Request, init?: RequestInit) => {
        capturedInit = init;
        return Promise.resolve(mockResponse);
      }) as unknown as typeof fetch;

      const options: GraphQLRequestOptions = {
        url: 'https://example.com/graphql',
        query: 'query ListItems { items { id } }',
        operationName: '   ListItems   ',
      };

      await sendGraphQLRequest(options);

      const requestBody = JSON.parse(capturedInit?.body as string);
      expect(requestBody.operationName).toBe('ListItems');
    });

    test('should omit empty operation name', async () => {
      let capturedInit: RequestInit | undefined;
      const mockResponse = new Response('{}', { status: 200, statusText: 'OK' });

      globalThis.fetch = ((url: string | URL | Request, init?: RequestInit) => {
        capturedInit = init;
        return Promise.resolve(mockResponse);
      }) as unknown as typeof fetch;

      const options: GraphQLRequestOptions = {
        url: 'https://example.com/graphql',
        query: '{ items }',
        operationName: '   ',
      };

      await sendGraphQLRequest(options);

      const requestBody = JSON.parse(capturedInit?.body as string);
      expect(requestBody.operationName).toBeUndefined();
    });

    test('should combine auth headers with custom headers', async () => {
      let capturedInit: RequestInit | undefined;
      const mockResponse = new Response('{}', { status: 200, statusText: 'OK' });

      globalThis.fetch = ((url: string | URL | Request, init?: RequestInit) => {
        capturedInit = init;
        return Promise.resolve(mockResponse);
      }) as unknown as typeof fetch;

      const options: GraphQLRequestOptions = {
        url: 'https://example.com/graphql',
        query: '{ users { name } }',
        headers: { 'X-Custom': 'my-value' },
        auth: {
          type: 'bearer',
          token: 'combined-token',
        },
      };

      await sendGraphQLRequest(options);

      expect(capturedInit?.headers).toEqual({
        'Content-Type': 'application/json',
        'X-Custom': 'my-value',
        Authorization: 'Bearer combined-token',
      });
    });

    test('should not include variables in payload when empty string', async () => {
      let capturedInit: RequestInit | undefined;
      const mockResponse = new Response('{}', { status: 200, statusText: 'OK' });

      globalThis.fetch = ((url: string | URL | Request, init?: RequestInit) => {
        capturedInit = init;
        return Promise.resolve(mockResponse);
      }) as unknown as typeof fetch;

      const options: GraphQLRequestOptions = {
        url: 'https://example.com/graphql',
        query: '{ items }',
        variables: '',
      };

      await sendGraphQLRequest(options);

      const requestBody = JSON.parse(capturedInit?.body as string);
      expect(requestBody.variables).toBeUndefined();
    });
  });
});
