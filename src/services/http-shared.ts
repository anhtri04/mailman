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
import type { AuthConfig } from '../types';
import type { ResponseState, SSEEvent } from '../types';

export function applyAuthToRequest(options: {
  url: string;
  headers?: Record<string, string>;
  auth?: AuthConfig;
}): { url: string; headers: Record<string, string> } {
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

  return { url, headers };
}

export interface HttpExecutionOptions {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
}

export interface SSEStreamHandlers {
  onOpen: (initial: Pick<ResponseState, 'status' | 'statusText' | 'headers' | 'time'>) => void;
  onEvent: (event: SSEEvent) => void;
  onError?: (message: string) => void;
  onComplete?: () => void;
}

export interface SSEStreamController {
  disconnect: () => void;
}

export interface StreamExecutionResult {
  response: ResponseState;
  controller: SSEStreamController;
}

function headersFromResponse(response: Response): Record<string, string> {
  const responseHeaders: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    responseHeaders[key] = value;
  });
  return responseHeaders;
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

    clearTimeout(timeoutId);

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    const bodyText = await response.text();
    const endTime = Date.now();

    return {
      status: response.status,
      statusText: response.statusText,
      body: bodyText || '(empty response)',
      headers: responseHeaders,
      time: endTime - startTime,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    const { type, message } = classifyError(error);
    const endTime = Date.now();

    return {
      status: 0,
      statusText: type.toUpperCase(),
      body: `Error: ${message}`,
      headers: {},
      time: endTime - startTime,
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
  const streamController: SSEStreamController = {
    disconnect: () => {
      controller.abort();
    },
  };
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(options.url, {
      method: options.method,
      headers: options.headers,
      body: options.body,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const headers = headersFromResponse(response);
    const initial = {
      status: response.status,
      statusText: response.statusText,
      headers,
      time: Date.now() - startTime,
    };
    handlers.onOpen(initial);

    const contentType = headers['content-type']?.toLowerCase() ?? '';
    const isSSE = contentType.includes('text/event-stream');

    if (!isSSE) {
      const bodyText = await response.text();
      return {
        response: {
          ...initial,
          body: bodyText || '(empty response)',
          mode: 'single',
          isStreaming: false,
        },
        controller: streamController,
      };
    }

    const reader = response.body?.getReader();
    if (!reader) {
      const endTime = Date.now();
      return {
        response: {
          status: 0,
          statusText: 'STREAM',
          body: 'Error: SSE stream is not readable',
          headers,
          time: endTime - startTime,
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

    while (true) {
      const { done, value } = await reader.read();
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
    return {
      response: {
        ...initial,
        body: rawChunks.join('') || '(empty response)',
        time: endTime - startTime,
        mode: 'sse',
        isStreaming: false,
      },
      controller: streamController,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    const { type, message } = classifyError(error);
    handlers.onError?.(message);
    const endTime = Date.now();
    return {
      response: {
        status: 0,
        statusText: type.toUpperCase(),
        body: `Error: ${message}`,
        headers: {},
        time: endTime - startTime,
        mode: 'single',
        isStreaming: false,
      },
      controller: streamController,
    };
  }
}
