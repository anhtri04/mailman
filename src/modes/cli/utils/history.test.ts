import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { existsSync, mkdirSync } from 'fs';
import { readFile, unlink, writeFile } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';
import { rawRequestBody } from '../../../core/services';
import { loadHistory } from '../../../core/services/history';
import { appendCliHistoryEntry } from './history';

const MAILMAN_DIR = join(homedir(), '.mailman');
const HISTORY_FILE = join(MAILMAN_DIR, 'history.json');

describe('appendCliHistoryEntry', () => {
  let originalHistoryRaw: string | null = null;

  beforeEach(async () => {
    mkdirSync(MAILMAN_DIR, { recursive: true });
    if (existsSync(HISTORY_FILE)) {
      originalHistoryRaw = await readFile(HISTORY_FILE, 'utf-8').catch(() => null);
    }
    await writeFile(HISTORY_FILE, JSON.stringify([]), 'utf-8');
  });

  afterEach(async () => {
    if (originalHistoryRaw !== null) {
      await writeFile(HISTORY_FILE, originalHistoryRaw, 'utf-8');
      originalHistoryRaw = null;
      return;
    }
    await unlink(HISTORY_FILE).catch(() => {});
  });

  test('persists anonymous REST request without collection references', async () => {
    await appendCliHistoryEntry(
      {
        method: 'GET',
        url: 'https://api.example.com/users',
        headers: { Accept: 'application/json' },
        body: rawRequestBody(),
      },
      {
        status: 200,
        statusText: 'OK',
        body: '{"ok":true}',
        headers: { 'content-type': 'application/json' },
        time: 42,
      },
      { protocol: 'rest' },
    );

    const history = await loadHistory();
    expect(history[0]?.protocol).toBe('rest');
    expect(history[0]?.collectionId).toBeUndefined();
    expect(history[0]?.requestId).toBeUndefined();
    expect(history[0]?.request.url).toBe('https://api.example.com/users');
  });

  test('stores shell metadata for collection-backed requests', async () => {
    await appendCliHistoryEntry(
      {
        method: 'POST',
        url: 'https://api.example.com/users',
        headers: {},
        body: rawRequestBody('{"name":"Ada"}'),
      },
      {
        status: 201,
        statusText: 'Created',
        body: '{"id":"1"}',
        headers: {},
        time: 25,
      },
      {
        protocol: 'rest',
        collectionId: 'collection-1',
        requestId: 'request-1',
        requestName: 'Create user',
      },
    );

    const history = await loadHistory();
    expect(history[0]?.collectionId).toBe('collection-1');
    expect(history[0]?.requestId).toBe('request-1');
    expect(history[0]?.requestName).toBe('Create user');
  });

  test('persists SSE as REST history with SSE summary', async () => {
    await appendCliHistoryEntry(
      {
        method: 'GET',
        url: 'https://api.example.com/events',
        headers: { Accept: 'text/event-stream' },
        body: rawRequestBody(),
      },
      {
        mode: 'sse',
        status: 200,
        statusText: 'OK',
        body: 'data: hello',
        headers: { 'content-type': 'text/event-stream' },
        time: 100,
        streamStartedAt: 10,
        streamEndedAt: 60,
        streamEventCount: 2,
        sseMeta: { droppedEvents: 1 },
      },
      { protocol: 'sse' },
    );

    const history = await loadHistory();
    expect(history[0]?.protocol).toBe('rest');
    expect(history[0]?.response.mode).toBe('sse');
    expect(history[0]?.response.sseSummary).toEqual({
      eventCount: 2,
      droppedEvents: 1,
      durationMs: 50,
    });
  });

  test('normalizes GraphQL query and variables from CLI payload', async () => {
    await appendCliHistoryEntry(
      {
        method: 'POST',
        url: 'https://api.example.com/graphql',
        headers: { 'Content-Type': 'application/json' },
        body: rawRequestBody(
          JSON.stringify({ query: 'query User { me { id } }', variables: { id: '1' } }),
        ),
      },
      {
        status: 200,
        statusText: 'OK',
        body: '{"data":{"me":{"id":"1"}}}',
        headers: {},
        time: 30,
      },
      { protocol: 'graphql' },
    );

    const history = await loadHistory();
    expect(history[0]?.protocol).toBe('graphql');
    expect(history[0]?.request.body).toEqual(rawRequestBody('query User { me { id } }'));
    expect(history[0]?.request.variables).toBe(JSON.stringify({ id: '1' }, null, 2));
  });
});
