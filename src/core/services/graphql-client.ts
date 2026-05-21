import type { AuthConfig, RequestScripts, RequestStats } from '../types';
import { executeHttpRequest, resolveAuthToRequest } from './http-shared';

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
  updatedAuth?: AuthConfig;
}> {
  const payload: Record<string, unknown> = {
    query: options.query,
  };

  if (options.variables?.trim()) {
    try {
      payload.variables = JSON.parse(options.variables);
    } catch {
      payload.variables = options.variables;
    }
  }

  if (options.operationName?.trim()) {
    payload.operationName = options.operationName.trim();
  }

  const { url, headers, updatedAuth } = await resolveAuthToRequest({
    url: options.url,
    headers: { 'Content-Type': 'application/json', ...options.headers },
    auth: options.auth,
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

  return {
    ...result,
    stats: {
      ...result.stats,
      network: { ...result.stats.network, url: options.url },
    },
    updatedAuth,
  };
}
