import type { RequestOptions, RequestStats } from '../types';
import { executeHttpRequest, executeHttpStreamRequest, resolveAuthToRequest } from './http-shared';
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
  stats: RequestStats;
  updatedAuth?: RequestOptions['auth'];
}> {
  const { url, headers, updatedAuth } = await resolveAuthToRequest(options);

  // GET and HEAD requests should not include a body
  const shouldExcludeBody = options.method === 'GET' || options.method === 'HEAD';

  const result = await executeHttpRequest(
    {
      url,
      method: options.method,
      headers,
      body: shouldExcludeBody ? undefined : options.body,
    },
    timeoutMs,
  );

  return {
    ...result,
    stats: {
      ...result.stats,
      network: { ...result.stats.network, url: options.url },
    },
    updatedAuth,
  };
}

export async function sendRequestWithStreaming(
  options: RequestOptions,
  handlers: SSEStreamHandlers,
  timeoutMs?: number,
): Promise<StreamExecutionResult> {
  const { url, headers, updatedAuth } = await resolveAuthToRequest(options);
  const shouldExcludeBody = options.method === 'GET' || options.method === 'HEAD';

  const streamResult = await executeHttpStreamRequest(
    {
      url,
      method: options.method,
      headers,
      body: shouldExcludeBody ? undefined : options.body,
    },
    {
      ...handlers,
      onOpen: (initial) => {
        handlers.onOpen({
          ...initial,
          stats: initial.stats
            ? {
                ...initial.stats,
                network: { ...initial.stats.network, url: options.url },
              }
            : undefined,
        });
      },
    },
    timeoutMs,
  );

  return {
    ...streamResult,
    response: {
      ...streamResult.response,
      stats: streamResult.response.stats
        ? {
            ...streamResult.response.stats,
            network: { ...streamResult.response.stats.network, url: options.url },
          }
        : undefined,
    },
    updatedAuth,
  };
}
