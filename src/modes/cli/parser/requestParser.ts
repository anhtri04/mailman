import { detectCurl, parseCurl } from '../../../utils/curlUtility';
import type { ParsedRequest } from '../types';

const HTTP_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']);

export function parseRequestInput(raw: string): ParsedRequest {
  if (!raw.trim()) {
    throw new Error('Request input is empty');
  }

  const normalized = detectCurl(raw) ? raw : toPseudoCurl(raw);
  const parsed = parseCurl(normalized);

  return {
    kind: 'request',
    raw,
    request: {
      method: parsed.method,
      url: parsed.url,
      headers: parsed.headers,
      body: parsed.body,
    },
  };
}

function toPseudoCurl(input: string): string {
  const trimmed = input.trim();
  const tokens = trimmed.split(/\s+/);
  const first = tokens[0]?.toUpperCase();

  if (first && HTTP_METHODS.has(first)) {
    return `curl -X ${first} ${tokens.slice(1).join(' ')}`.trim();
  }

  return `curl ${trimmed}`;
}
