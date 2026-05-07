import type { RequestOptions } from '../types';
import { applyAuthToRequest, executeHttpRequest } from './http-shared';

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

  return executeHttpRequest(
    {
      url,
      method: options.method,
      headers,
      body: options.body,
    },
    timeoutMs,
  );
}
