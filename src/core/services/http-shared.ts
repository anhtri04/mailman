export const DEFAULT_TIMEOUT = 30000;

export interface HttpError {
  type: 'network' | 'timeout' | 'dns' | 'unknown';
  message: string;
}

export function classifyError(error: unknown): HttpError {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();

    if (msg.includes('timeout') || msg.includes('abort')) {
      return { type: 'timeout', message: 'Request timed out' };
    }

    if (
      msg.includes('dns') ||
      msg.includes('enotfound') ||
      msg.includes('eai_again') ||
      msg.includes('getaddrinfo')
    ) {
      return { type: 'dns', message: 'DNS lookup failed - check the URL' };
    }

    if (
      msg.includes('network') ||
      msg.includes('fetch') ||
      msg.includes('econnrefused') ||
      msg.includes('socket')
    ) {
      return { type: 'network', message: 'Network error - check your connection' };
    }

    return { type: 'unknown', message: error.message };
  }

  return { type: 'unknown', message: 'An unexpected error occurred' };
}

import { createSSEParser } from './sse-parser';
import { buildRequestStats } from './request-stats';
import type { AuthConfig } from '../types';
import type { RequestStats, ResponseState, SSEEvent } from '../types';
import type { FetchBody } from './request-body';

interface ResolvedAuthRequest {
  url: string;
  headers: Record<string, string>;
  updatedAuth?: AuthConfig;
}

function encodeBasicAuth(username: string, password: string): string {
  return Buffer.from(`${username}:${password}`).toString('base64');
}

function isTokenValid(expiresAt?: number): boolean {
  if (!expiresAt) return true;
  return Date.now() + 30_000 < expiresAt;
}

interface OAuthTokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  tokenType?: string;
}

async function requestOAuthToken(
  tokenUrl: string,
  body: URLSearchParams,
  clientId?: string,
  clientSecret?: string,
): Promise<OAuthTokenResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  if (clientId && clientSecret) {
    headers.Authorization = `Basic ${encodeBasicAuth(clientId, clientSecret)}`;
  }

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers,
    body: body.toString(),
  });

  const payload = (await response.json()) as Record<string, unknown>;
  if (!response.ok || typeof payload.access_token !== 'string') {
    const detail =
      typeof payload.error_description === 'string'
        ? payload.error_description
        : response.statusText;
    throw new Error(`OAuth token request failed: ${detail}`);
  }

  const expiresIn = typeof payload.expires_in === 'number' ? payload.expires_in : undefined;

  return {
    accessToken: payload.access_token,
    refreshToken: typeof payload.refresh_token === 'string' ? payload.refresh_token : undefined,
    tokenType: typeof payload.token_type === 'string' ? payload.token_type : 'Bearer',
    expiresAt: expiresIn ? Date.now() + expiresIn * 1000 : undefined,
  };
}

export async function resolveAuthToRequest(options: {
  url: string;
  headers?: Record<string, string>;
  auth?: AuthConfig;
}): Promise<ResolvedAuthRequest> {
  let url = options.url;
  const headers: Record<string, string> = { ...(options.headers ?? {}) };

  if (!options.auth || options.auth.type === 'none') {
    return { url, headers };
  }

  const auth = options.auth;

  if (auth.type === 'bearer' && auth.token) {
    headers['Authorization'] = `Bearer ${auth.token}`;
  } else if (auth.type === 'api-key' && auth.key && auth.value) {
    if (auth.location === 'query') {
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}${encodeURIComponent(auth.key)}=${encodeURIComponent(auth.value)}`;
    } else {
      headers[auth.key] = auth.value;
    }
  }

  if (auth.type === 'basic') {
    headers['Authorization'] = `Basic ${encodeBasicAuth(auth.username ?? '', auth.password ?? '')}`;
    return { url, headers };
  }

  if (auth.type === 'oauth2' && auth.oauth2) {
    const oauth = auth.oauth2;
    let accessToken = oauth.accessToken;
    let refreshToken = oauth.refreshToken;
    let expiresAt = oauth.expiresAt;
    let tokenType = oauth.tokenType ?? 'Bearer';

    if (!accessToken || !isTokenValid(expiresAt)) {
      if (refreshToken) {
        const body = new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        });
        if (!oauth.clientSecret) {
          body.set('client_id', oauth.clientId);
        }

        const refreshed = await requestOAuthToken(
          oauth.tokenUrl,
          body,
          oauth.clientId,
          oauth.clientSecret,
        );
        accessToken = refreshed.accessToken;
        refreshToken = refreshed.refreshToken ?? refreshToken;
        expiresAt = refreshed.expiresAt;
        tokenType = refreshed.tokenType ?? tokenType;
      } else if (oauth.grantType === 'client_credentials') {
        const body = new URLSearchParams({ grant_type: 'client_credentials' });
        if (oauth.scope?.trim()) {
          body.set('scope', oauth.scope.trim());
        }
        if (!oauth.clientSecret) {
          body.set('client_id', oauth.clientId);
        }

        const token = await requestOAuthToken(
          oauth.tokenUrl,
          body,
          oauth.clientId,
          oauth.clientSecret,
        );
        accessToken = token.accessToken;
        refreshToken = token.refreshToken;
        expiresAt = token.expiresAt;
        tokenType = token.tokenType ?? tokenType;
      } else if (oauth.grantType === 'authorization_code' && oauth.code) {
        const body = new URLSearchParams({
          grant_type: 'authorization_code',
          code: oauth.code,
        });
        if (oauth.redirectUri?.trim()) {
          body.set('redirect_uri', oauth.redirectUri.trim());
        }
        if (oauth.codeVerifier?.trim()) {
          body.set('code_verifier', oauth.codeVerifier.trim());
        }
        if (!oauth.clientSecret) {
          body.set('client_id', oauth.clientId);
        }

        const token = await requestOAuthToken(
          oauth.tokenUrl,
          body,
          oauth.clientId,
          oauth.clientSecret,
        );
        accessToken = token.accessToken;
        refreshToken = token.refreshToken;
        expiresAt = token.expiresAt;
        tokenType = token.tokenType ?? tokenType;
      } else {
        throw new Error('OAuth2 auth is not fully configured');
      }
    }

    if (accessToken) {
      headers['Authorization'] = `${tokenType} ${accessToken}`;
    }

    return {
      url,
      headers,
      updatedAuth: {
        ...auth,
        oauth2: {
          ...oauth,
          accessToken,
          refreshToken,
          expiresAt,
          tokenType,
        },
      },
    };
  }

  return { url, headers };
}

export interface HttpExecutionOptions {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: FetchBody;
  statsBody?: string;
}

export interface SSEStreamHandlers {
  onOpen: (
    initial: Pick<ResponseState, 'status' | 'statusText' | 'headers' | 'time' | 'stats'>,
  ) => void;
  onEvent: (event: SSEEvent) => void;
  onController?: (controller: SSEStreamController) => void;
  onError?: (message: string) => void;
  onComplete?: () => void;
}

export interface SSEStreamController {
  disconnect: () => void;
}

export interface StreamExecutionResult {
  response: ResponseState;
  controller: SSEStreamController;
  updatedAuth?: AuthConfig;
}

function headersFromResponse(response: Response): Record<string, string> {
  const responseHeaders: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    responseHeaders[key] = value;
  });
  return responseHeaders;
}

function statsRequest(options: HttpExecutionOptions) {
  return {
    url: options.url,
    method: options.method,
    headers: options.headers,
    body: options.statsBody ?? (typeof options.body === 'string' ? options.body : undefined),
  };
}

export async function executeHttpRequest(
  options: HttpExecutionOptions,
  timeoutMs: number = DEFAULT_TIMEOUT,
): Promise<{
  status: number;
  statusText: string;
  body: string;
  headers: Record<string, string>;
  time: number;
  stats: RequestStats;
}> {
  const startTime = Date.now();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(options.url, {
      method: options.method,
      headers: options.headers,
      body: options.body,
      signal: controller.signal,
    });

    const responseStartTime = Date.now();
    clearTimeout(timeoutId);

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    const bodyText = await response.text();
    const endTime = Date.now();
    const body = bodyText || '(empty response)';
    const totalMs = endTime - startTime;

    return {
      status: response.status,
      statusText: response.statusText,
      body,
      headers: responseHeaders,
      time: totalMs,
      stats: buildRequestStats({
        request: statsRequest(options),
        response: {
          url: response.url,
          redirected: response.redirected,
          headers: responseHeaders,
          body,
        },
        timings: {
          totalMs,
          ttfbMs: responseStartTime - startTime,
          downloadMs: endTime - responseStartTime,
        },
      }),
    };
  } catch (error) {
    clearTimeout(timeoutId);

    const { type, message } = classifyError(error);
    const endTime = Date.now();
    const body = `Error: ${message}`;
    const totalMs = endTime - startTime;

    return {
      status: 0,
      statusText: type.toUpperCase(),
      body,
      headers: {},
      time: totalMs,
      stats: buildRequestStats({
        request: statsRequest(options),
        response: { headers: {}, body },
        timings: { totalMs },
        errorType: type,
      }),
    };
  }
}

export async function executeHttpStreamRequest(
  options: HttpExecutionOptions,
  handlers: SSEStreamHandlers,
  timeoutMs: number = DEFAULT_TIMEOUT,
): Promise<StreamExecutionResult> {
  const startTime = Date.now();

  const controller = new AbortController();
  let reader:
    | {
        read: () => Promise<{ done: boolean; value?: Uint8Array }>;
        cancel: (reason?: unknown) => Promise<void>;
      }
    | undefined;
  let disconnected = false;
  const streamController: SSEStreamController = {
    disconnect: () => {
      disconnected = true;
      controller.abort();
      void reader?.cancel().catch(() => {});
    },
  };
  handlers.onController?.(streamController);
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(options.url, {
      method: options.method,
      headers: options.headers,
      body: options.body,
      signal: controller.signal,
    });

    const responseStartTime = Date.now();
    clearTimeout(timeoutId);

    const headers = headersFromResponse(response);
    const initialTime = responseStartTime - startTime;
    const initial = {
      status: response.status,
      statusText: response.statusText,
      headers,
      time: initialTime,
      stats: buildRequestStats({
        request: statsRequest(options),
        response: {
          url: response.url,
          redirected: response.redirected,
          headers,
          body: '',
        },
        timings: {
          totalMs: initialTime,
          ttfbMs: initialTime,
          downloadMs: 0,
        },
      }),
    };
    handlers.onOpen(initial);

    const contentType = headers['content-type']?.toLowerCase() ?? '';
    const isSSE = contentType.includes('text/event-stream');

    if (!isSSE) {
      const bodyText = await response.text();
      const endTime = Date.now();
      const body = bodyText || '(empty response)';
      const totalMs = endTime - startTime;
      return {
        response: {
          ...initial,
          body,
          time: totalMs,
          stats: buildRequestStats({
            request: statsRequest(options),
            response: {
              url: response.url,
              redirected: response.redirected,
              headers,
              body,
            },
            timings: {
              totalMs,
              ttfbMs: responseStartTime - startTime,
              downloadMs: endTime - responseStartTime,
            },
          }),
          mode: 'single',
          isStreaming: false,
        },
        controller: streamController,
      };
    }

    reader = response.body?.getReader();
    if (!reader) {
      const endTime = Date.now();
      return {
        response: {
          status: 0,
          statusText: 'STREAM',
          body: 'Error: SSE stream is not readable',
          headers,
          time: endTime - startTime,
          stats: buildRequestStats({
            request: statsRequest(options),
            response: {
              url: response.url,
              redirected: response.redirected,
              headers,
              body: 'Error: SSE stream is not readable',
            },
            timings: {
              totalMs: endTime - startTime,
              ttfbMs: responseStartTime - startTime,
              downloadMs: endTime - responseStartTime,
            },
          }),
          mode: 'sse',
          isStreaming: false,
        },
        controller: streamController,
      };
    }

    const decoder = new TextDecoder();
    const rawChunks: string[] = [];

    const parser = createSSEParser({
      onEvent: handlers.onEvent,
      onRetry: () => {},
      onComment: () => {},
    });

    while (!disconnected && !controller.signal.aborted) {
      const { done, value } = await reader.read();
      if (disconnected || controller.signal.aborted) break;
      if (done) {
        parser.flush();
        handlers.onComplete?.();
        break;
      }

      if (value) {
        const text = decoder.decode(value, { stream: true });
        rawChunks.push(text);
        parser.push(text);
      }
    }

    const endTime = Date.now();
    const body = rawChunks.join('') || '(empty response)';
    const totalMs = endTime - startTime;
    return {
      response: {
        ...initial,
        body,
        time: totalMs,
        stats: buildRequestStats({
          request: statsRequest(options),
          response: {
            url: response.url,
            redirected: response.redirected,
            headers,
            body,
          },
          timings: {
            totalMs,
            ttfbMs: responseStartTime - startTime,
            downloadMs: endTime - responseStartTime,
          },
        }),
        mode: 'sse',
        isStreaming: false,
      },
      controller: streamController,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    const { type, message } = classifyError(error);
    const endTime = Date.now();
    const body = disconnected ? '(disconnected)' : `Error: ${message}`;
    const totalMs = endTime - startTime;
    if (!disconnected) {
      handlers.onError?.(message);
    }
    return {
      response: {
        status: 0,
        statusText: disconnected ? 'DISCONNECTED' : type.toUpperCase(),
        body,
        headers: {},
        time: totalMs,
        stats: buildRequestStats({
          request: statsRequest(options),
          response: { headers: {}, body },
          timings: { totalMs },
          errorType: type,
        }),
        mode: disconnected ? 'sse' : 'single',
        isStreaming: false,
      },
      controller: streamController,
    };
  }
}
