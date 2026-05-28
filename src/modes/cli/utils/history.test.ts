import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { rawRequestBody } from '../../../core/services';
import { loadHistory } from '../../../core/services/history';
import { closeDatabase } from '../../../core/services/storage-db';
import { appendCliHistoryEntry } from './history';

describe('appendCliHistoryEntry', () => {
  let testHome: string;

  beforeEach(async () => {
    testHome = await mkdtemp(join(tmpdir(), 'mailman-cli-history-'));
    process.env.MAILMAN_HOME = testHome;
    closeDatabase();
  });

  afterEach(async () => {
    closeDatabase();
    delete process.env.MAILMAN_HOME;
    await rm(testHome, { recursive: true, force: true });
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
