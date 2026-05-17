import type { RequestOptions } from '../../../core/types';
import type { ParsedRequest } from '../types';
import { lexInput, type InputToken } from './lexer';

const HTTP_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']);
const VALUE_OPTIONS = new Set([
  '--header',
  '-H',
  '--query',
  '-q',
  '--body',
  '--data',
  '-d',
  '--json',
  '--auth',
  '--timeout',
  '--stream',
  '--variables',
  '--operation',
]);

export function parseRequestInput(raw: string): ParsedRequest {
  if (!raw.trim()) {
    throw new Error('Request input is empty');
  }

  const tokens = lexInput(raw).tokens;
  if (tokens[0]?.value !== 'http') {
    throw new Error('Request must start with "http"');
  }

  const protocol = tokens[1]?.value.toLowerCase();
  if (!protocol) {
    throw new Error('Missing HTTP protocol. Usage: http rest METHOD URL');
  }

  if (protocol === 'rest') {
    return parseRestRequest(raw, tokens);
  }

  if (protocol === 'graphql' || protocol === 'gql') {
    return parseGraphQLRequest(raw, tokens, protocol === 'gql' ? 'graphql' : protocol);
  }

  if (protocol === 'sse') {
    return parseSseRequest(raw, tokens);
  }

  throw new Error(`Unknown HTTP protocol: ${protocol}`);
}

function parseRestRequest(raw: string, tokens: InputToken[]): ParsedRequest {
  const method = tokens[2]?.value.toUpperCase();
  if (!method || !HTTP_METHODS.has(method)) {
    throw new Error('Missing or invalid REST method. Usage: http rest METHOD URL');
  }

  const url = tokens[3]?.value;
  if (!url) {
    throw new Error('Missing REST URL. Usage: http rest METHOD URL');
  }

  const request: RequestOptions = {
    method,
    url,
    headers: {},
    body: '',
  };

  applyOptions(request, tokens.slice(4), 'rest');

  return { kind: 'request', raw, request, protocol: 'rest' };
}

function parseGraphQLRequest(
  raw: string,
  tokens: InputToken[],
  protocol: 'graphql',
): ParsedRequest {
  const url = tokens[2]?.value;
  if (!url) {
    throw new Error('Missing GraphQL URL. Usage: http graphql URL --query QUERY');
  }

  const request: RequestOptions = {
    method: 'POST',
    url,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: '',
  };

  const graphql: { query?: string; variables?: unknown; operationName?: string } = {};
  applyOptions(request, tokens.slice(3), protocol, graphql);

  if (!graphql.query) {
    throw new Error('Missing GraphQL query. Usage: http graphql URL --query QUERY');
  }

  request.body = JSON.stringify(graphql);
  return { kind: 'request', raw, request, protocol };
}

function parseSseRequest(raw: string, tokens: InputToken[]): ParsedRequest {
  const url = tokens[2]?.value;
  if (!url) {
    throw new Error('Missing SSE URL. Usage: http sse URL');
  }

  const request: RequestOptions = {
    method: 'GET',
    url,
    headers: {
      Accept: 'text/event-stream',
    },
    body: '',
  };

  applyOptions(request, tokens.slice(3), 'sse');
  return { kind: 'request', raw, request, protocol: 'sse', responseMode: 'sse' };
}

function applyOptions(
  request: RequestOptions,
  tokens: InputToken[],
  protocol: 'rest' | 'graphql' | 'sse',
  graphql?: { query?: string; variables?: unknown; operationName?: string },
): void {
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];
    if (!token) continue;

    const option = token.value;
    if (option === '--follow' || option === '--insecure' || option === '-k') {
      continue;
    }

    if (!VALUE_OPTIONS.has(option)) {
      throw new Error(`Unknown option: ${option}`);
    }

    const value = tokens[index + 1]?.value;
    if (!value) {
      throw new Error(`Missing value for option: ${option}`);
    }
    index++;

    switch (option) {
      case '--header':
      case '-H':
        applyHeader(request, value);
        break;
      case '--query':
        if (protocol === 'graphql' && graphql) {
          graphql.query = value;
        } else {
          request.url = appendQuery(request.url, value);
        }
        break;
      case '-q':
        request.url = appendQuery(request.url, value);
        break;
      case '--body':
      case '--data':
      case '-d':
        ensureProtocol(protocol, ['rest'], option);
        request.body = value;
        break;
      case '--json':
        ensureProtocol(protocol, ['rest'], option);
        request.body = value;
        request.headers = {
          ...request.headers,
          'Content-Type': request.headers?.['Content-Type'] ?? 'application/json',
        };
        break;
      case '--auth':
        applyAuth(request, value);
        break;
      case '--variables':
        ensureProtocol(protocol, ['graphql'], option);
        if (graphql) graphql.variables = parseJsonValue(value, option);
        break;
      case '--operation':
        ensureProtocol(protocol, ['graphql'], option);
        if (graphql) graphql.operationName = value;
        break;
      case '--timeout':
      case '--stream':
        break;
      default:
        break;
    }
  }
}

function ensureProtocol(
  current: 'rest' | 'graphql' | 'sse',
  allowed: Array<'rest' | 'graphql' | 'sse'>,
  option: string,
): void {
  if (!allowed.includes(current)) {
    throw new Error(`${option} is not valid for ${current} requests`);
  }
}

function applyHeader(request: RequestOptions, value: string): void {
  const colonIndex = value.indexOf(':');
  const equalsIndex = value.indexOf('=');
  let key = '';
  let headerValue = '';

  if (colonIndex > 0) {
    key = value.slice(0, colonIndex).trim();
    headerValue = value.slice(colonIndex + 1).trim();
  } else if (equalsIndex > 0) {
    key = value.slice(0, equalsIndex).trim();
    headerValue = value.slice(equalsIndex + 1).trim();
  }

  if (!key) {
    throw new Error('Header must be formatted as "Key: Value" or Key=Value');
  }

  request.headers = { ...request.headers, [key]: headerValue };
}

function appendQuery(url: string, pair: string): string {
  const equalsIndex = pair.indexOf('=');
  if (equalsIndex <= 0) {
    throw new Error('Query must be formatted as key=value');
  }

  const key = pair.slice(0, equalsIndex);
  const value = pair.slice(equalsIndex + 1);
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
}

function applyAuth(request: RequestOptions, value: string): void {
  if (value.startsWith('bearer:')) {
    request.headers = {
      ...request.headers,
      Authorization: `Bearer ${value.slice('bearer:'.length)}`,
    };
    return;
  }

  if (value.startsWith('basic:')) {
    const payload = value.slice('basic:'.length);
    request.headers = { ...request.headers, Authorization: `Basic ${btoa(payload)}` };
    return;
  }

  if (value.startsWith('apikey:')) {
    const pair = value.slice('apikey:'.length);
    const equalsIndex = pair.indexOf('=');
    if (equalsIndex <= 0) {
      throw new Error('API key auth must be formatted as apikey:Header=Value');
    }
    request.headers = {
      ...request.headers,
      [pair.slice(0, equalsIndex)]: pair.slice(equalsIndex + 1),
    };
    return;
  }

  throw new Error('Auth must be bearer:TOKEN, basic:USER:PASS, or apikey:Header=Value');
}

function parseJsonValue(value: string, option: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    throw new Error(`${option} must be valid JSON`);
  }
}
