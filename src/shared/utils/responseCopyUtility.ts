import { detectContentType, formatResponseBody } from './response-formatter';
import type { ResponseState } from '../../core/types';

export type RestResponseTab = 'body' | 'headers' | 'raw' | 'test';
export type SseResponseTab = 'events' | 'headers' | 'raw';
export type GraphqlResponseTab = 'body' | 'headers' | 'raw' | 'errors' | 'test';

function formatHeaders(headers: Record<string, string>): string {
  return Object.entries(headers)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');
}

function formatSseEvents(response: ResponseState): string {
  const events = response.sseEvents ?? [];
  if (events.length === 0) return 'No SSE events received yet.';

  return events
    .map((event) => {
      const lines = [
        `event: ${event.event ?? 'message'}`,
        `id: ${event.id ?? ''}`,
        `timestamp: ${new Date(event.timestamp).toISOString()}`,
      ];

      if (typeof event.retry === 'number') {
        lines.push(`retry: ${event.retry}`);
      }

      lines.push(`data: ${event.data}`);
      return lines.join('\n');
    })
    .join('\n\n');
}

function formatScriptResults(response: ResponseState): string {
  const results = response.scriptResults;
  if (!results?.beforeRequest && !results?.afterResponse)
    return 'No scripts were run for this response.';

  return [
    results.beforeRequest
      ? `Before Request: ${results.beforeRequest.success ? 'passed' : 'failed'}${results.beforeRequest.error ? `\nError: ${results.beforeRequest.error}` : ''}`
      : 'Before Request: not run',
    results.afterResponse
      ? `After Response: ${results.afterResponse.success ? 'passed' : 'failed'}${results.afterResponse.error ? `\nError: ${results.afterResponse.error}` : ''}\n${(
          results.afterResponse.assertions ?? []
        )
          .map(
            (assertion) =>
              `${assertion.passed ? '✓' : '✗'} ${assertion.name}${assertion.message ? ` - ${assertion.message}` : ''}`,
          )
          .join('\n')}`
      : 'After Response: not run',
  ].join('\n\n');
}

function formatGraphqlErrors(response: ResponseState): string {
  try {
    const parsed = JSON.parse(response.body) as {
      errors?: Array<{
        message?: string;
        path?: (string | number)[];
        locations?: Array<{ line: number; column: number }>;
      }>;
    };

    if (!Array.isArray(parsed.errors) || parsed.errors.length === 0) {
      return 'No GraphQL errors found.';
    }

    return parsed.errors
      .map((error, index) => {
        const lines = [`${index + 1}. ${error.message ?? 'Unknown GraphQL error'}`];

        if (error.path && error.path.length > 0) {
          lines.push(`path: ${error.path.join('.')}`);
        }

        const firstLocation = error.locations?.[0];
        if (firstLocation) {
          lines.push(`location: line ${firstLocation.line}, column ${firstLocation.column}`);
        }

        return lines.join('\n');
      })
      .join('\n\n');
  } catch {
    return 'Unable to parse response as JSON.';
  }
}

export function getRestTabCopyContent(
  response: ResponseState,
  tab: RestResponseTab,
  sseTab: SseResponseTab = 'events',
): string {
  if (response.mode === 'sse') {
    if (sseTab === 'headers') {
      return formatHeaders(response.headers);
    }

    if (sseTab === 'raw') {
      return response.body;
    }

    return formatSseEvents(response);
  }

  if (tab === 'headers') {
    return formatHeaders(response.headers);
  }

  if (tab === 'test') {
    return formatScriptResults(response);
  }

  if (tab === 'raw') {
    return response.body;
  }

  const contentType = detectContentType(response.headers, response.body);
  return formatResponseBody(response.body, contentType);
}

export function getGraphqlTabCopyContent(response: ResponseState, tab: GraphqlResponseTab): string {
  if (tab === 'headers') {
    return formatHeaders(response.headers);
  }

  if (tab === 'test') {
    return formatScriptResults(response);
  }

  if (tab === 'raw') {
    return response.body;
  }

  if (tab === 'errors') {
    return formatGraphqlErrors(response);
  }

  try {
    const parsed = JSON.parse(response.body);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return response.body;
  }
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  const platform = process.platform;

  try {
    if (platform === 'win32') {
      const proc = Bun.spawn(['clip'], { stdin: 'pipe' });
      proc.stdin!.write(text);
      proc.stdin!.end();
      await proc.exited;
      return proc.exitCode === 0;
    }

    if (platform === 'darwin') {
      const proc = Bun.spawn(['pbcopy'], { stdin: 'pipe' });
      proc.stdin!.write(text);
      proc.stdin!.end();
      await proc.exited;
      return proc.exitCode === 0;
    }

    const wlProc = Bun.spawn(['wl-copy'], { stdin: 'pipe' });
    wlProc.stdin!.write(text);
    wlProc.stdin!.end();
    const wlResult = await wlProc.exited;
    if (wlResult === 0) return true;

    const xclipProc = Bun.spawn(['xclip', '-selection', 'clipboard'], {
      stdin: 'pipe',
    });
    xclipProc.stdin!.write(text);
    xclipProc.stdin!.end();
    await xclipProc.exited;
    return xclipProc.exitCode === 0;
  } catch {
    return false;
  }
}
