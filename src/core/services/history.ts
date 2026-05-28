import { randomUUID } from 'crypto';
import type { AuthConfig, HistoryEntry, HistoryEntryInput } from '../types';
import { getDatabase } from './storage-db';

const REDACTED = '[REDACTED]';
const HISTORY_RETENTION_LIMIT = 300;
const SENSITIVE_HEADERS = new Set([
  'authorization',
  'cookie',
  'set-cookie',
  'x-api-key',
  'proxy-authorization',
]);

interface HistoryPayloadRow {
  payload_json: string;
}

function redactHeaders(headers: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => {
      if (SENSITIVE_HEADERS.has(key.toLowerCase())) {
        return [key, REDACTED];
      }
      return [key, value];
    }),
  );
}

function redactAuth(auth: AuthConfig | undefined): AuthConfig | undefined {
  if (!auth) return auth;

  if (auth.type === 'bearer') {
    return { ...auth, token: auth.token ? REDACTED : auth.token };
  }

  if (auth.type === 'api-key') {
    return { ...auth, value: auth.value ? REDACTED : auth.value };
  }

  if (auth.type === 'basic') {
    return { ...auth, password: auth.password ? REDACTED : auth.password };
  }

  if (auth.type === 'oauth2') {
    return {
      ...auth,
      oauth2: auth.oauth2
        ? {
            ...auth.oauth2,
            clientSecret: auth.oauth2.clientSecret ? REDACTED : auth.oauth2.clientSecret,
            codeVerifier: auth.oauth2.codeVerifier ? REDACTED : auth.oauth2.codeVerifier,
            accessToken: auth.oauth2.accessToken ? REDACTED : auth.oauth2.accessToken,
            refreshToken: auth.oauth2.refreshToken ? REDACTED : auth.oauth2.refreshToken,
          }
        : auth.oauth2,
    };
  }

  return auth;
}

function sanitizeEntry(entry: HistoryEntryInput): HistoryEntryInput {
  return {
    ...entry,
    request: {
      ...entry.request,
      headers: redactHeaders(entry.request.headers),
      auth: redactAuth(entry.request.auth),
    },
    response: {
      ...entry.response,
      headers: redactHeaders(entry.response.headers),
    },
  };
}

function createHistoryId(): string {
  return `${Date.now()}-${randomUUID()}`;
}

function normalizeLimit(limit: number): number {
  if (!Number.isFinite(limit)) return HISTORY_RETENTION_LIMIT;
  return Math.max(1, Math.floor(limit));
}

function parseHistoryEntry(row: HistoryPayloadRow): HistoryEntry | null {
  try {
    return JSON.parse(row.payload_json) as HistoryEntry;
  } catch {
    return null;
  }
}

function parseHistoryRows(rows: HistoryPayloadRow[]): HistoryEntry[] {
  return rows.map(parseHistoryEntry).filter((entry): entry is HistoryEntry => entry !== null);
}

export async function loadHistory(): Promise<HistoryEntry[]> {
  const db = getDatabase();
  const rows = db
    .query(
      `
      SELECT payload_json
      FROM history
      ORDER BY timestamp DESC, rowid DESC
      LIMIT ?
      `,
    )
    .all(HISTORY_RETENTION_LIMIT) as HistoryPayloadRow[];

  return parseHistoryRows(rows);
}

export async function loadHistoryForRequest(
  requestId: string,
  limit = HISTORY_RETENTION_LIMIT,
): Promise<HistoryEntry[]> {
  const db = getDatabase();
  const rows = db
    .query(
      `
      SELECT payload_json
      FROM history
      WHERE request_id = ?
      ORDER BY timestamp DESC, rowid DESC
      LIMIT ?
      `,
    )
    .all(requestId, normalizeLimit(limit)) as HistoryPayloadRow[];

  return parseHistoryRows(rows);
}

export async function loadHistoryForCollection(
  collectionId: string,
  limit = HISTORY_RETENTION_LIMIT,
): Promise<HistoryEntry[]> {
  const db = getDatabase();
  const rows = db
    .query(
      `
      SELECT payload_json
      FROM history
      WHERE collection_id = ?
      ORDER BY timestamp DESC, rowid DESC
      LIMIT ?
      `,
    )
    .all(collectionId, normalizeLimit(limit)) as HistoryPayloadRow[];

  return parseHistoryRows(rows);
}

export async function appendHistoryEntry(entry: HistoryEntryInput): Promise<void> {
  const db = getDatabase();
  const timestamp = Date.now();
  const nextEntry: HistoryEntry = {
    ...sanitizeEntry(entry),
    id: createHistoryId(),
    timestamp,
  };

  const insert = db.query(`
    INSERT INTO history (
      id,
      timestamp,
      protocol,
      collection_id,
      request_id,
      request_name,
      method,
      url,
      status,
      time_ms,
      payload_json
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const prune = db.query(`
    DELETE FROM history
    WHERE rowid NOT IN (
      SELECT rowid
      FROM history
      ORDER BY timestamp DESC, rowid DESC
      LIMIT ?
    )
  `);

  const transaction = db.transaction(() => {
    insert.run(
      nextEntry.id,
      nextEntry.timestamp,
      nextEntry.protocol,
      nextEntry.collectionId ?? null,
      nextEntry.requestId ?? null,
      nextEntry.requestName ?? null,
      nextEntry.request.method,
      nextEntry.request.url,
      nextEntry.response.status,
      nextEntry.response.time,
      JSON.stringify(nextEntry),
    );

    prune.run(HISTORY_RETENTION_LIMIT);
  });

  transaction();
}

export async function deleteHistoryEntry(id: string): Promise<void> {
  const db = getDatabase();
  db.query('DELETE FROM history WHERE id = ?').run(id);
}

export async function clearHistory(): Promise<void> {
  const db = getDatabase();
  db.run('DELETE FROM history');
}
