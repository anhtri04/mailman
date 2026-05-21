import type { RequestOptions, RequestStats, ScriptExecutionSummary } from '../types';
import { executeHttpRequest, executeHttpStreamRequest, resolveAuthToRequest } from './http-shared';
import type { SSEStreamHandlers, StreamExecutionResult } from './http-shared';
import { ScriptService } from './scripts';

const scriptService = new ScriptService();

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
  scriptResults?: ScriptExecutionSummary;
  updatedAuth?: RequestOptions['auth'];
}> {
  const before = await scriptService.runBeforeRequest(options);
  const scriptedOptions = before.request;
  const { url, headers, updatedAuth } = await resolveAuthToRequest(scriptedOptions);

  // GET and HEAD requests should not include a body
  const shouldExcludeBody = scriptedOptions.method === 'GET' || scriptedOptions.method === 'HEAD';

  const result = await executeHttpRequest(
    {
      url,
      method: scriptedOptions.method,
      headers,
      body: shouldExcludeBody ? undefined : scriptedOptions.body,
    },
    timeoutMs,
  );

  const response = {
    ...result,
    stats: {
      ...result.stats,
      network: { ...result.stats.network, url: scriptedOptions.url },
    },
  };
  const after = await scriptService.runAfterResponse(scriptedOptions, response);

  return {
    ...response,
    scriptResults: {
      beforeRequest: before.result,
      afterResponse: after,
    },
    updatedAuth,
  };
}

export async function sendRequestWithStreaming(
  options: RequestOptions,
  handlers: SSEStreamHandlers,
  timeoutMs?: number,
): Promise<StreamExecutionResult> {
  const before = await scriptService.runBeforeRequest(options);
  const scriptedOptions = before.request;
  const { url, headers, updatedAuth } = await resolveAuthToRequest(scriptedOptions);
  const shouldExcludeBody = scriptedOptions.method === 'GET' || scriptedOptions.method === 'HEAD';

  const streamResult = await executeHttpStreamRequest(
    {
      url,
      method: scriptedOptions.method,
      headers,
      body: shouldExcludeBody ? undefined : scriptedOptions.body,
    },
    {
      ...handlers,
      onOpen: (initial) => {
        handlers.onOpen({
          ...initial,
          stats: initial.stats
            ? {
                ...initial.stats,
                network: { ...initial.stats.network, url: scriptedOptions.url },
              }
            : undefined,
        });
      },
    },
    timeoutMs,
  );

  const response = {
    ...streamResult.response,
    stats: streamResult.response.stats
      ? {
          ...streamResult.response.stats,
          network: { ...streamResult.response.stats.network, url: scriptedOptions.url },
        }
      : undefined,
  };
  const after = await scriptService.runAfterResponse(scriptedOptions, response);

  return {
    ...streamResult,
    response: {
      ...response,
      scriptResults: {
        beforeRequest: before.result,
        afterResponse: after,
      },
    },
    updatedAuth,
  };
}
