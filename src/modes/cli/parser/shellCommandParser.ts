import type { ParsedShellCommand } from '../types';
import { lexInput } from './lexer';

export function parseShellCommandInput(raw: string): ParsedShellCommand {
  const tokens = lexInput(raw).tokens;
  const name = tokens[0]?.value.toLowerCase() ?? '';
  const args = tokens.slice(1).map((token) => token.value);

  return { kind: 'shell', raw, name, args };
}

export function isShellCommandName(name: string | undefined): boolean {
  if (!name) return false;
  return new Set([
    'cd',
    'ls',
    'pwd',
    'tree',
    'cat',
    'open',
    'select',
    'run',
    'send',
    'clear',
    'help',
  ]).has(name.toLowerCase());
}
