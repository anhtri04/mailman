import type { RequestOptions, ResponseState } from '../types';

const DEFAULT_TIMEOUT = 30000;

interface HttpError {
  type: 'network' | 'timeout' | 'dns' | 'unknown';
  message: string;
}

function classifyError(error: unknown): HttpError {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('timeout') || message.includes('abort')) {
      return { type: 'timeout', message: 'Request timed out' };
    }

    if (
      message.includes('dns') ||
      message.includes('ENOTFOUND') ||
      message.includes('eai_again') ||
      message.includes('getaddrinfo')
    ) {
      return { type: 'dns', message: 'DNS lookup failed - check the URL' };
    }

    if (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('econnrefused') ||
      message.includes('socket')
    ) {
      return { type: 'network', message: 'Network error - check your connection' };
    }

    return { type: 'unknown', message: error.message };
  }

  return { type: 'unknown', message: 'An unexpected error occurred' };
}

export async function sendRequest(
  options: RequestOptions,
  timeoutMs: number = DEFAULT_TIMEOUT,
): Promise<ResponseState> {
  const startTime = Date.now();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const fetchOptions: RequestInit = {
      method: options.method,
      headers: options.headers,
      signal: controller.signal,
    };

    if (options.body && ['POST', 'PUT', 'PATCH'].includes(options.method)) {
      fetchOptions.body = options.body;
    }

    const response = await fetch(options.url, fetchOptions);

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

    const httpError = classifyError(error);

    const endTime = Date.now();

    return {
      status: 0,
      statusText: httpError.type.toUpperCase(),
      body: `Error: ${httpError.message}`,
      headers: {},
      time: endTime - startTime,
    };
  }
}
