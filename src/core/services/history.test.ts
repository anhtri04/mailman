import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  appendHistoryEntry,
  clearHistory,
  deleteHistoryEntry,
  loadHistory,
  loadHistoryForCollection,
  loadHistoryForRequest,
} from './history';
import { rawRequestBody } from './request-body';
import { closeDatabase } from './storage-db';

async function appendBasicHistoryEntry(
  collectionId: string,
  requestId: string,
  requestName: string,
): Promise<void> {
  await appendHistoryEntry({
    protocol: 'rest',
    collectionId,
    requestId,
    requestName,
    request: { method: 'GET', url: `https://example.com/${requestId}`, headers: {} },
    response: { status: 200, statusText: 'OK', body: requestName, headers: {}, time: 10 },
  });
}

describe('history persistence', () => {
  let testHome: string;

  beforeEach(async () => {
    testHome = await mkdtemp(join(tmpdir(), 'mailman-history-'));
    process.env.MAILMAN_HOME = testHome;
    closeDatabase();
  });

  afterEach(async () => {
    closeDatabase();
    delete process.env.MAILMAN_HOME;
    await rm(testHome, { recursive: true, force: true });
  });

  test('loadHistory returns empty array when database does not exist', async () => {
    const result = await loadHistory();
    expect(result).toEqual([]);
  });

  test('appendHistoryEntry stores latest first', async () => {
    await appendHistoryEntry({
      protocol: 'rest',
      collectionId: 'c1',
      requestId: 'r1',
      requestName: 'Get users',
      request: {
        method: 'GET',
        url: 'https://api.example.com/users',
        headers: { accept: 'application/json' },
      },
      response: {
        status: 200,
        statusText: 'OK',
        body: '{"ok":true}',
        headers: { 'content-type': 'application/json' },
        time: 120,
      },
    });

    await appendHistoryEntry({
      protocol: 'graphql',
      collectionId: 'c2',
      requestId: 'r2',
      requestName: 'Get profile',
      request: {
        method: 'POST',
        url: 'https://api.example.com/graphql',
        headers: { 'content-type': 'application/json' },
        body: rawRequestBody('query User { me { id } }'),
        variables: '{"id":"1"}',
      },
      response: {
        status: 200,
        statusText: 'OK',
        body: '{"data":{"me":{"id":"1"}}}',
        headers: { 'content-type': 'application/json' },
        time: 95,
      },
    });

    const history = await loadHistory();
    expect(history.length).toBe(2);
    expect(history[0]?.requestName).toBe('Get profile');
    expect(history[1]?.requestName).toBe('Get users');
  });

  test('appendHistoryEntry redacts sensitive request data by default', async () => {
    await appendHistoryEntry({
      protocol: 'rest',
      collectionId: 'c1',
      requestId: 'r1',
      requestName: 'Sensitive request',
      request: {
        method: 'POST',
        url: 'https://api.example.com/secure',
        headers: {
          authorization: 'Bearer secret-token',
          cookie: 'session=123',
          'x-api-key': 'my-api-key',
          accept: 'application/json',
        },
        auth: {
          type: 'oauth2',
          oauth2: {
            grantType: 'client_credentials',
            tokenUrl: 'https://auth.example.com/token',
            clientId: 'abc',
            clientSecret: 'top-secret',
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
          },
        },
      },
      response: {
        status: 200,
        statusText: 'OK',
        body: 'ok',
        headers: {
          'set-cookie': 'token=xyz',
        },
        time: 50,
      },
    });

    const history = await loadHistory();
    const entry = history[0];
    expect(entry).toBeDefined();
    expect(entry?.request.headers.authorization).toBe('[REDACTED]');
    expect(entry?.request.headers.cookie).toBe('[REDACTED]');
    expect(entry?.request.headers['x-api-key']).toBe('[REDACTED]');
    expect(entry?.request.headers.accept).toBe('application/json');
    expect(entry?.request.auth?.oauth2?.clientSecret).toBe('[REDACTED]');
    expect(entry?.request.auth?.oauth2?.accessToken).toBe('[REDACTED]');
    expect(entry?.request.auth?.oauth2?.refreshToken).toBe('[REDACTED]');
    expect(entry?.response.headers['set-cookie']).toBe('[REDACTED]');
  });

  test('deleteHistoryEntry removes matching entry only', async () => {
    await appendBasicHistoryEntry('c1', 'r1', 'First');
    await appendBasicHistoryEntry('c1', 'r2', 'Second');

    const initial = await loadHistory();
    await deleteHistoryEntry(initial[0]!.id);
    const final = await loadHistory();
    expect(final.length).toBe(1);
    expect(final[0]?.requestName).toBe('First');
  });

  test('clearHistory removes all entries', async () => {
    await appendBasicHistoryEntry('c1', 'r1', 'First');
    await clearHistory();
    expect(await loadHistory()).toEqual([]);
  });

  test('loadHistoryForRequest returns matching request history latest first', async () => {
    await appendBasicHistoryEntry('c1', 'r1', 'First r1');
    await appendBasicHistoryEntry('c1', 'r2', 'Only r2');
    await appendBasicHistoryEntry('c1', 'r1', 'Second r1');

    const history = await loadHistoryForRequest('r1');
    expect(history.map((entry) => entry.requestName)).toEqual(['Second r1', 'First r1']);
  });

  test('loadHistoryForRequest applies limit', async () => {
    await appendBasicHistoryEntry('c1', 'r1', 'First r1');
    await appendBasicHistoryEntry('c1', 'r1', 'Second r1');

    const history = await loadHistoryForRequest('r1', 1);
    expect(history.map((entry) => entry.requestName)).toEqual(['Second r1']);
  });

  test('loadHistoryForCollection returns matching collection history latest first', async () => {
    await appendBasicHistoryEntry('c1', 'r1', 'First c1');
    await appendBasicHistoryEntry('c2', 'r2', 'Only c2');
    await appendBasicHistoryEntry('c1', 'r3', 'Second c1');

    const history = await loadHistoryForCollection('c1');
    expect(history.map((entry) => entry.requestName)).toEqual(['Second c1', 'First c1']);
  });

  test('appendHistoryEntry enforces retention limit of 300 entries', async () => {
    for (let index = 0; index < 300; index += 1) {
      await appendBasicHistoryEntry('c1', `r-${index}`, `Request ${index}`);
    }

    await appendBasicHistoryEntry('c1', 'r-new', 'Newest request');

    const history = await loadHistory();
    expect(history.length).toBe(300);
    expect(history[0]?.requestName).toBe('Newest request');
    expect(history.some((entry) => entry.requestName === 'Request 0')).toBe(false);
  });

  test('appendHistoryEntry preserves script snapshots and results', async () => {
    await appendHistoryEntry({
      protocol: 'rest',
      collectionId: 'c1',
      requestId: 'r1',
      requestName: 'Scripted request',
      request: {
        method: 'GET',
        url: 'https://example.com/scripted',
        headers: {},
        scripts: {
          beforeRequest: "request.headers['x-test'] = '1';",
          afterResponse: "test('ok', () => expect(response.status).toBe(200));",
        },
      },
      response: {
        status: 200,
        statusText: 'OK',
        body: 'ok',
        headers: {},
        time: 10,
        scriptResults: {
          afterResponse: {
            success: true,
            output: ['done'],
            assertions: [{ name: 'ok', passed: true }],
          },
        },
      },
    });

    const history = await loadHistory();
    expect(history[0]?.request.scripts?.beforeRequest).toContain('x-test');
    expect(history[0]?.response.scriptResults?.afterResponse?.assertions?.[0]?.passed).toBe(true);
  });
});
