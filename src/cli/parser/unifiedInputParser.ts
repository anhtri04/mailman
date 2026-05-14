import type { ParsedInput } from '../types';
import { parseCommandInput } from './commandParser';
import { parseRequestInput } from './requestParser';

export function parseUnifiedInput(raw: string): ParsedInput {
  const trimmed = raw.trim();
  if (trimmed.startsWith('/')) {
    return parseCommandInput(trimmed);
  }
  return parseRequestInput(trimmed);
}
