import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { existsSync } from 'fs';
import { readFile, unlink, writeFile } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';
import { appendHistoryEntry, clearHistory, deleteHistoryEntry, loadHistory } from './history';

const MAILMAN_DIR = join(homedir(), '.mailman');
const HISTORY_FILE = join(MAILMAN_DIR, 'history.json');

describe('history persistence', () => {
  let originalHistoryRaw: string | null = null;

  beforeEach(async () => {
    if (existsSync(HISTORY_FILE)) {
      originalHistoryRaw = await readFile(HISTORY_FILE, 'utf-8').catch(() => null);
    }
    await writeFile(HISTORY_FILE, JSON.stringify([]), 'utf-8').catch(() => {});
  });

  afterEach(async () => {
    if (originalHistoryRaw !== null) {
      await writeFile(HISTORY_FILE, originalHistoryRaw, 'utf-8');
      return;
    }
    await unlink(HISTORY_FILE).catch(() => {});
  });

  test('loadHistory returns empty array when file does not exist', async () => {
    await unlink(HISTORY_FILE).catch(() => {});
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
        body: 'query User { me { id } }',
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
    await appendHistoryEntry({
      protocol: 'rest',
      collectionId: 'c1',
      requestId: 'r1',
      requestName: 'First',
      request: { method: 'GET', url: 'https://example.com/1', headers: {} },
      response: { status: 200, statusText: 'OK', body: '1', headers: {}, time: 10 },
    });
    await appendHistoryEntry({
      protocol: 'rest',
      collectionId: 'c1',
      requestId: 'r2',
      requestName: 'Second',
      request: { method: 'GET', url: 'https://example.com/2', headers: {} },
      response: { status: 200, statusText: 'OK', body: '2', headers: {}, time: 10 },
    });

    const initial = await loadHistory();
    await deleteHistoryEntry(initial[0]!.id);
    const final = await loadHistory();
    expect(final.length).toBe(1);
    expect(final[0]?.requestName).toBe('First');
  });

  test('clearHistory removes all entries', async () => {
    await appendHistoryEntry({
      protocol: 'rest',
      collectionId: 'c1',
      requestId: 'r1',
      requestName: 'First',
      request: { method: 'GET', url: 'https://example.com/1', headers: {} },
      response: { status: 200, statusText: 'OK', body: '1', headers: {}, time: 10 },
    });
    await clearHistory();
    expect(await loadHistory()).toEqual([]);
  });

  test('appendHistoryEntry enforces retention limit of 300 entries', async () => {
    const seed = Array.from({ length: 300 }, (_, index) => ({
      id: `id-${index}`,
      timestamp: index,
      protocol: 'rest',
      collectionId: 'c1',
      requestId: `r-${index}`,
      requestName: `Request ${index}`,
      request: { method: 'GET', url: `https://example.com/${index}`, headers: {} },
      response: { status: 200, statusText: 'OK', body: String(index), headers: {}, time: 10 },
    }));
    await writeFile(HISTORY_FILE, JSON.stringify(seed), 'utf-8');

    await appendHistoryEntry({
      protocol: 'rest',
      collectionId: 'c1',
      requestId: 'r-new',
      requestName: 'Newest request',
      request: { method: 'GET', url: 'https://example.com/new', headers: {} },
      response: { status: 200, statusText: 'OK', body: 'new', headers: {}, time: 10 },
    });

    const history = await loadHistory();
    expect(history.length).toBe(300);
    expect(history[0]?.requestName).toBe('Newest request');
    expect(history.some((entry) => entry.requestName === 'Request 299')).toBe(false);
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
