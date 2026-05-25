import { describe, expect, test } from 'bun:test';
import { ScriptService } from './scripts';
import type { RequestOptions, ResponseState } from '../types';

function createResponse(overrides: Partial<ResponseState> = {}): ResponseState {
  return {
    status: 200,
    statusText: 'OK',
    body: '{"ok":true,"items":["a","b"]}',
    headers: { 'content-type': 'application/json' },
    time: 10,
    ...overrides,
  };
}

describe('ScriptService', () => {
  test('detects configured scripts', () => {
    const service = new ScriptService();
    expect(service.hasScripts()).toBe(false);
    expect(service.hasScripts({ beforeRequest: '   ' })).toBe(false);
    expect(service.hasScripts({ afterResponse: 'console.log("ok")' })).toBe(true);
  });

  test('runs before request script and applies request mutations', async () => {
    const service = new ScriptService();
    const request: RequestOptions = {
      method: 'POST',
      url: 'https://example.com/users',
      headers: {},
      body: '{"name":"Jane"}',
      scripts: {
        beforeRequest: `
          request.url += '?debug=true';
          request.headers['x-script'] = '1';
          const body = JSON.parse(request.body);
          body.scripted = true;
          request.body = JSON.stringify(body);
          console.log('mutated request');
        `,
      },
    };

    const result = await service.runBeforeRequest(request);

    expect(result.result?.success).toBe(true);
    expect(result.result?.output).toEqual(['mutated request']);
    expect(result.request.url).toBe('https://example.com/users?debug=true');
    expect(result.request.headers?.['x-script']).toBe('1');
    expect(result.request.body).toEqual({
      mode: 'raw',
      content: '{"name":"Jane","scripted":true}',
    });
  });

  test('does not apply before request mutations when script throws', async () => {
    const service = new ScriptService();
    const request: RequestOptions = {
      method: 'GET',
      url: 'https://example.com/users',
      headers: {},
      scripts: {
        beforeRequest: `
          request.url = 'https://example.com/changed';
          throw new Error('bad setup');
        `,
      },
    };

    const result = await service.runBeforeRequest(request);

    expect(result.result?.success).toBe(false);
    expect(result.result?.error).toBe('bad setup');
    expect(result.request.url).toBe('https://example.com/users');
  });

  test('runs after response tests and captures assertions', async () => {
    const service = new ScriptService();
    const request: RequestOptions = {
      method: 'GET',
      url: 'https://example.com/users',
      scripts: {
        afterResponse: `
          test('status is 200', () => {
            expect(response.status).toBe(200);
          });
          test('body has ok', () => {
            expect(response.json().ok).toBeTruthy();
          });
          console.log('checked response');
        `,
      },
    };

    const result = await service.runAfterResponse(request, createResponse());

    expect(result?.success).toBe(true);
    expect(result?.output).toEqual(['checked response']);
    expect(result?.assertions).toEqual([
      { name: 'status is 200', passed: true },
      { name: 'body has ok', passed: true },
    ]);
  });

  test('records failed assertions without throwing from the service', async () => {
    const service = new ScriptService();
    const request: RequestOptions = {
      method: 'GET',
      url: 'https://example.com/users',
      scripts: {
        afterResponse: `
          test('status is 201', () => {
            expect(response.status).toBe(201);
          });
        `,
      },
    };

    const result = await service.runAfterResponse(request, createResponse());

    expect(result?.success).toBe(false);
    expect(result?.assertions?.[0]?.name).toBe('status is 201');
    expect(result?.assertions?.[0]?.passed).toBe(false);
    expect(result?.assertions?.[0]?.message).toContain('Expected 200 to be 201');
  });
});
