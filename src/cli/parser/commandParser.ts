import type { ParsedCommand } from '../types';

export function parseCommandInput(raw: string): ParsedCommand {
  const withoutSlash = raw.slice(1).trim();
  const parts = withoutSlash.split(/\s+/).filter(Boolean);
  const name = (parts[0] ?? '').toLowerCase();
  const args = parts.slice(1);
  return { kind: 'command', raw, name, args };
}
