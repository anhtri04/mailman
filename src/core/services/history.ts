import { existsSync, mkdirSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';
import type { AuthConfig, HistoryEntry, HistoryEntryInput } from '../types';

const MAILMAN_DIR = join(homedir(), '.mailman');
const HISTORY_FILE = join(MAILMAN_DIR, 'history.json');
const REDACTED = '[REDACTED]';
const HISTORY_RETENTION_LIMIT = 300;
const SENSITIVE_HEADERS = new Set([
  'authorization',
  'cookie',
  'set-cookie',
  'x-api-key',
  'proxy-authorization',
]);

function ensureDir() {
  if (!existsSync(MAILMAN_DIR)) {
    mkdirSync(MAILMAN_DIR, { recursive: true });
  }
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

export async function loadHistory(): Promise<HistoryEntry[]> {
  try {
    ensureDir();
    const raw = await readFile(HISTORY_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed as HistoryEntry[];
    }
    return [];
  } catch {
    return [];
  }
}

export async function appendHistoryEntry(entry: HistoryEntryInput): Promise<void> {
  const existing = await loadHistory();
  const nextEntry: HistoryEntry = {
    ...sanitizeEntry(entry),
    id: Date.now().toString(),
    timestamp: Date.now(),
  };
  const next = [nextEntry, ...existing].slice(0, HISTORY_RETENTION_LIMIT);
  ensureDir();
  await writeFile(HISTORY_FILE, JSON.stringify(next, null, 2), 'utf-8');
}

export async function deleteHistoryEntry(id: string): Promise<void> {
  const existing = await loadHistory();
  const next = existing.filter((entry) => entry.id !== id);
  ensureDir();
  await writeFile(HISTORY_FILE, JSON.stringify(next, null, 2), 'utf-8');
}

export async function clearHistory(): Promise<void> {
  ensureDir();
  await writeFile(HISTORY_FILE, JSON.stringify([], null, 2), 'utf-8');
}
