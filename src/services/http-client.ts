import type { RequestOptions } from '../types';
import { applyAuthToRequest, executeHttpRequest, executeHttpStreamRequest } from './http-shared';
import type { SSEStreamHandlers, StreamExecutionResult } from './http-shared';

export async function sendRequest(
  options: RequestOptions,
  timeoutMs?: number,
): Promise<{
  status: number;
  statusText: string;
  body: string;
  headers: Record<string, string>;
  time: number;
}> {
  const { url, headers } = applyAuthToRequest(options);

  // GET and HEAD requests should not include a body
  const shouldExcludeBody = options.method === 'GET' || options.method === 'HEAD';

  return executeHttpRequest(
    {
      url,
      method: options.method,
      headers,
      body: shouldExcludeBody ? undefined : options.body,
    },
    timeoutMs,
  );
}

export async function sendRequestWithStreaming(
  options: RequestOptions,
  handlers: SSEStreamHandlers,
  timeoutMs?: number,
): Promise<StreamExecutionResult> {
  const { url, headers } = applyAuthToRequest(options);
  const shouldExcludeBody = options.method === 'GET' || options.method === 'HEAD';

  return executeHttpStreamRequest(
    {
      url,
      method: options.method,
      headers,
      body: shouldExcludeBody ? undefined : options.body,
    },
    handlers,
    timeoutMs,
  );
}
