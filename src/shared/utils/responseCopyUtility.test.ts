import { describe, expect, test } from 'bun:test';
import {
  copyTextToClipboard,
  getGraphqlTabCopyContent,
  getRestTabCopyContent,
} from './responseCopyUtility';
import type { ResponseState } from '../../core/types';

describe('responseCopyUtility', () => {
  const baseResponse: ResponseState = {
    status: 200,
    statusText: 'OK',
    body: '{"hello":"world"}',
    headers: { 'content-type': 'application/json', 'x-test': 'yes' },
    time: 10,
  };

  test('returns formatted REST body content for body tab', () => {
    const result = getRestTabCopyContent(baseResponse, 'body');
    expect(result).toContain('\n');
    expect(result).toContain('"hello"');
  });

  test('returns REST headers content for headers tab', () => {
    const result = getRestTabCopyContent(baseResponse, 'headers');
    expect(result).toContain('content-type: application/json');
    expect(result).toContain('x-test: yes');
  });

  test('returns REST raw body content for raw tab', () => {
    const result = getRestTabCopyContent(baseResponse, 'raw');
    expect(result).toBe(baseResponse.body);
  });

  test('returns SSE events content for events tab', () => {
    const sseResponse: ResponseState = {
      ...baseResponse,
      mode: 'sse',
      body: '(streaming)',
      sseEvents: [
        {
          event: 'message',
          id: 'evt-1',
          data: 'first event',
          timestamp: 1710000000000,
        },
      ],
    };

    const result = getRestTabCopyContent(sseResponse, 'body', 'events');
    expect(result).toContain('event: message');
    expect(result).toContain('id: evt-1');
    expect(result).toContain('data: first event');
  });

  test('returns GraphQL errors content for errors tab', () => {
    const graphqlErrorResponse: ResponseState = {
      ...baseResponse,
      body: JSON.stringify({
        errors: [
          {
            message: 'Cannot query field',
            path: ['query', 'users'],
            locations: [{ line: 2, column: 5 }],
          },
        ],
      }),
    };

    const result = getGraphqlTabCopyContent(graphqlErrorResponse, 'errors');
    expect(result).toContain('Cannot query field');
    expect(result).toContain('path: query.users');
    expect(result).toContain('location: line 2, column 5');
  });

  test('returns GraphQL body pretty JSON for body tab', () => {
    const response: ResponseState = {
      ...baseResponse,
      body: '{"data":{"ok":true}}',
    };

    const result = getGraphqlTabCopyContent(response, 'body');
    expect(result).toContain('\n');
    expect(result).toContain('"data"');
  });

  test('copyTextToClipboard returns a boolean', async () => {
    const result = await copyTextToClipboard('hello world');
    expect(typeof result).toBe('boolean');
  });
});
