import { mkdirSync, existsSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';

const MAILMAN_DIR = join(homedir(), '.mailman');
const PREFERENCES_FILE = join(MAILMAN_DIR, 'preferences.json');

function ensureDir() {
  if (!existsSync(MAILMAN_DIR)) {
    mkdirSync(MAILMAN_DIR, { recursive: true });
  }
}

export interface Preferences {
  themeId: string;
}

export async function loadPreferences(): Promise<Preferences> {
  try {
    ensureDir();
    const data = await readFile(PREFERENCES_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    if (parsed && typeof parsed.themeId === 'string') {
      return parsed as Preferences;
    }
    return { themeId: 'opencode' };
  } catch {
    return { themeId: 'opencode' };
  }
}

export async function savePreferences(preferences: Preferences): Promise<void> {
  ensureDir();
  await writeFile(PREFERENCES_FILE, JSON.stringify(preferences, null, 2), 'utf-8');
}
