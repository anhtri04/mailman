import type { Protocol } from '../../core/types';

export interface ParsedCurl {
  protocol: Protocol;
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string;
  query: string;
  variables: string;
}

export interface CurlInput {
  protocol: Protocol;
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: string;
  query?: string;
  variables?: string;
}

function cleanInput(input: string): string {
  let cleaned = input.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\w*\s*\n?/, '').replace(/\n?```\s*$/, '');
  }
  cleaned = cleaned.replace(/^[$>]\s*/, '');
  cleaned = cleaned.replace(/\\\s*\n\s*/g, ' ');
  cleaned = cleaned.replace(/\n/g, ' ');
  return cleaned.trim();
}

function tokenize(curlString: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  let current = '';

  while (i < curlString.length) {
    const char = curlString[i];
    if (char === undefined) break;

    if (char === ' ' || char === '\t') {
      if (current) {
        tokens.push(current);
        current = '';
      }
      i++;
      continue;
    }

    if (char === "'" || char === '"') {
      if (current) {
        tokens.push(current);
        current = '';
      }
      const quote = char;
      i++;
      let tokenValue = '';

      while (i < curlString.length) {
        const ch = curlString[i];
        if (ch === undefined) break;
        if (ch === '\\') {
          i++;
          const escaped = curlString[i];
          if (escaped !== undefined) {
            if (escaped === quote || escaped === '\\') {
              tokenValue += escaped;
            } else {
              tokenValue += '\\' + escaped;
            }
            i++;
          }
        } else if (ch === quote) {
          i++;
          break;
        } else {
          tokenValue += ch;
          i++;
        }
      }
      tokens.push(tokenValue);
      continue;
    }

    current += char;
    i++;
  }

  if (current) {
    tokens.push(current);
  }

  return tokens;
}

export function detectCurl(input: string): boolean {
  if (!input || !input.trim()) return false;
  let cleaned = input.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\w*\s*\n?/, '').replace(/\n?```\s*$/, '');
  }
  cleaned = cleaned.replace(/^[$>]\s*/, '');
  cleaned = cleaned.trim();
  return /^curl(\b|\.exe)/i.test(cleaned);
}

export function detectProtocol(curlString: string): Protocol {
  const cleaned = cleanInput(curlString);
  const tokens = tokenize(cleaned);

  for (const token of tokens) {
    if (/^https?:\/\//.test(token)) {
      try {
        const urlObj = new URL(token);
        if (urlObj.pathname.includes('/graphql')) {
          return 'graphql';
        }
      } catch {
        // invalid URL, continue checking
      }
    }
  }

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token === undefined) continue;
    if (
      token === '-d' ||
      token === '--data' ||
      token === '--data-raw' ||
      token === '--data-binary'
    ) {
      const next = tokens[i + 1];
      if (next) {
        try {
          const parsed = JSON.parse(next);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && 'query' in parsed) {
            return 'graphql';
          }
        } catch {
          // not JSON, continue checking
        }
      }
    }
  }

  return 'rest';
}

export function parseCurl(curlString: string): ParsedCurl {
  const cleaned = cleanInput(curlString);
  const tokens = tokenize(cleaned);

  if (tokens.length === 0 || !/^curl(\.exe)?$/i.test(tokens[0]!)) {
    throw new Error('Not a valid curl command');
  }

  let method = '';
  const headers: Record<string, string> = {};
  let body = '';
  let url = '';
  let query = '';
  let variables = '';
  let protocol: Protocol = 'rest';

  const methodFlags = new Set(['-X', '--request']);
  const headerFlags = new Set(['-H', '--header']);
  const dataFlags = new Set(['-d', '--data', '--data-raw', '--data-binary']);
  const urlFlags = new Set(['--url']);
  const booleanFlags = new Set([
    '--compressed',
    '-k',
    '--insecure',
    '-s',
    '--silent',
    '-v',
    '--verbose',
    '-L',
    '--location',
    '-i',
    '--include',
  ]);

  const valueFlags = new Set([
    '-o',
    '--output',
    '-O',
    '--remote-name',
    '-w',
    '--write-out',
    '--cacert',
    '--cert',
    '--key',
    '--connect-timeout',
    '--max-time',
    '-m',
    '-u',
    '--user',
    '-b',
    '--cookie',
    '-c',
    '--cookie-jar',
    '-e',
    '--referer',
    '-A',
    '--user-agent',
  ]);

  for (let i = 1; i < tokens.length; i++) {
    const token = tokens[i];
    if (token === undefined) continue;

    if (methodFlags.has(token)) {
      method = tokens[i + 1] ?? 'GET';
      i++;
    } else if (headerFlags.has(token)) {
      const headerValue = tokens[i + 1];
      if (headerValue) {
        const colonIndex = headerValue.indexOf(':');
        if (colonIndex > 0) {
          const key = headerValue.slice(0, colonIndex).trim();
          const value = headerValue.slice(colonIndex + 1).trim();
          headers[key] = value;
        }
        i++;
      }
    } else if (dataFlags.has(token)) {
      body = tokens[i + 1] ?? '';
      i++;
    } else if (urlFlags.has(token)) {
      url = tokens[i + 1] ?? '';
      i++;
    } else if (booleanFlags.has(token)) {
      // skip boolean flags, they don't consume the next argument
    } else if (valueFlags.has(token)) {
      const next = tokens[i + 1];
      if (next && !next.startsWith('-')) {
        i++;
      }
    } else if (/^https?:\/\//.test(token) && !url) {
      url = token;
    }
  }

  if (!method) {
    method = body ? 'POST' : 'GET';
  }
  method = method.toUpperCase();

  protocol = detectProtocol(curlString);

  if (protocol === 'graphql' && body) {
    try {
      const parsed = JSON.parse(body);
      if (parsed.query) {
        query = typeof parsed.query === 'string' ? parsed.query : JSON.stringify(parsed.query);
      }
      if (parsed.variables) {
        variables =
          typeof parsed.variables === 'string'
            ? parsed.variables
            : JSON.stringify(parsed.variables);
      }
    } catch {
      // body is not JSON, treat as REST query
    }
  }

  return { protocol, method, url, headers, body, query, variables };
}

function escapeCurlArg(value: string): string {
  if (!value.includes("'")) {
    return `'${value}'`;
  }
  const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\$/g, '\\$');
  return `"${escaped}"`;
}

export function buildCurl(input: CurlInput): string {
  const parts: string[] = ['curl'];

  if (input.protocol === 'graphql') {
    parts.push('-X POST');
    parts.push(escapeCurlArg(input.url));

    const headers = input.headers ?? {};
    for (const [key, value] of Object.entries(headers)) {
      parts.push(`-H ${escapeCurlArg(`${key}: ${value}`)}`);
    }
    if (!headers['Content-Type'] && !headers['content-type']) {
      parts.push(`-H ${escapeCurlArg('Content-Type: application/json')}`);
    }

    const graphqlBody: Record<string, unknown> = {
      query: input.query ?? input.body ?? '',
    };
    if (input.variables) {
      try {
        graphqlBody.variables = JSON.parse(input.variables);
      } catch {
        graphqlBody.variables = input.variables;
      }
    }
    parts.push(`-d ${escapeCurlArg(JSON.stringify(graphqlBody))}`);
  } else {
    const method = input.method.toUpperCase();
    parts.push(`-X ${method}`);
    parts.push(escapeCurlArg(input.url));

    const headers = input.headers ?? {};
    for (const [key, value] of Object.entries(headers)) {
      parts.push(`-H ${escapeCurlArg(`${key}: ${value}`)}`);
    }

    if (input.body) {
      parts.push(`-d ${escapeCurlArg(input.body)}`);
    }
  }

  return parts.join(' ');
}

export async function copyCurl(input: CurlInput): Promise<boolean> {
  const curlString = buildCurl(input);
  const platform = process.platform;

  try {
    if (platform === 'win32') {
      const proc = Bun.spawn(['clip'], { stdin: 'pipe' });
      proc.stdin!.write(curlString);
      proc.stdin!.end();
      await proc.exited;
      return proc.exitCode === 0;
    } else if (platform === 'darwin') {
      const proc = Bun.spawn(['pbcopy'], { stdin: 'pipe' });
      proc.stdin!.write(curlString);
      proc.stdin!.end();
      await proc.exited;
      return proc.exitCode === 0;
    } else {
      const wlProc = Bun.spawn(['wl-copy'], { stdin: 'pipe' });
      wlProc.stdin!.write(curlString);
      wlProc.stdin!.end();
      const wlResult = await wlProc.exited;
      if (wlResult === 0) return true;

      const xclipProc = Bun.spawn(['xclip', '-selection', 'clipboard'], {
        stdin: 'pipe',
      });
      xclipProc.stdin!.write(curlString);
      xclipProc.stdin!.end();
      await xclipProc.exited;
      return xclipProc.exitCode === 0;
    }
  } catch {
    return false;
  }
}
