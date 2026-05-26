import type { ParsedInput } from '../types';
import { lexInput } from './lexer';
import { parseCommandInput } from './commandParser';
import { parseRequestInput } from './requestParser';
import { isShellCommandName, parseShellCommandInput } from './shellCommandParser';

export function parseUnifiedInput(raw: string): ParsedInput {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error('Input is empty');
  }

  if (trimmed.startsWith('/')) {
    return parseCommandInput(trimmed);
  }

  const firstToken = lexInput(trimmed).tokens[0]?.value;
  if (firstToken === 'http') {
    return parseRequestInput(trimmed);
  }

  if (isShellCommandName(firstToken)) {
    return parseShellCommandInput(trimmed);
  }

  throw new Error(
    'Unknown input. Start a request with "http", use /help, or run a shell command like ls.',
  );
}
