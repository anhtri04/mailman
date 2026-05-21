import type { AuthConfig, RequestScripts, RequestStats, ScriptExecutionSummary } from '../types';
import { executeHttpRequest, resolveAuthToRequest } from './http-shared';
import { ScriptService } from './scripts';

const scriptService = new ScriptService();

export interface GraphQLRequestOptions {
  url: string;
  query: string;
  variables?: string;
  operationName?: string;
  headers?: Record<string, string>;
  auth?: AuthConfig;
  scripts?: RequestScripts;
}

export async function sendGraphQLRequest(
  options: GraphQLRequestOptions,
  timeoutMs?: number,
): Promise<{
  status: number;
  statusText: string;
  body: string;
  headers: Record<string, string>;
  time: number;
  stats: RequestStats;
  scriptResults?: ScriptExecutionSummary;
  updatedAuth?: AuthConfig;
}> {
  const before = await scriptService.runBeforeRequest(options);
  const scriptedOptions = before.request;
  const payload: Record<string, unknown> = {
    query: scriptedOptions.query,
  };

  if (scriptedOptions.variables?.trim()) {
    try {
      payload.variables = JSON.parse(scriptedOptions.variables);
    } catch {
      payload.variables = scriptedOptions.variables;
    }
  }

  if (scriptedOptions.operationName?.trim()) {
    payload.operationName = scriptedOptions.operationName.trim();
  }

  const { url, headers, updatedAuth } = await resolveAuthToRequest({
    url: scriptedOptions.url,
    headers: { 'Content-Type': 'application/json', ...scriptedOptions.headers },
    auth: scriptedOptions.auth,
  });

  const result = await executeHttpRequest(
    {
      url,
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
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
