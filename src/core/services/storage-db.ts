import { existsSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { Database } from 'bun:sqlite';

const DEFAULT_MAILMAN_DIR = join(homedir(), '.mailman');
const DB_FILE_NAME = 'mailman.sqlite';

let database: Database | null = null;
let databasePath: string | null = null;

function getMailmanDir(): string {
  return process.env.MAILMAN_HOME ?? DEFAULT_MAILMAN_DIR;
}

function ensureDir(path: string): void {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

function migrate(db: Database): void {
  db.run('PRAGMA journal_mode = WAL');
  db.run('PRAGMA foreign_keys = ON');
  db.run('PRAGMA busy_timeout = 5000');

  db.run(`
    CREATE TABLE IF NOT EXISTS history (
      id TEXT PRIMARY KEY,
      timestamp INTEGER NOT NULL,
      protocol TEXT NOT NULL,
      collection_id TEXT,
      request_id TEXT,
      request_name TEXT,
      method TEXT NOT NULL,
      url TEXT NOT NULL,
      status INTEGER NOT NULL,
      time_ms INTEGER NOT NULL,
      payload_json TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_history_timestamp
    ON history(timestamp DESC)
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_history_request_id
    ON history(request_id, timestamp DESC)
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_history_collection_id
    ON history(collection_id, timestamp DESC)
  `);
}

export function getDatabase(): Database {
  const nextPath = join(getMailmanDir(), DB_FILE_NAME);
  if (database && databasePath === nextPath) {
    return database;
  }

  if (database) {
    database.close();
    database = null;
    databasePath = null;
  }

  ensureDir(getMailmanDir());
  database = new Database(nextPath);
  databasePath = nextPath;
  migrate(database);

  return database;
}

export function closeDatabase(): void {
  if (!database) return;

  database.close();
  database = null;
  databasePath = null;
}
