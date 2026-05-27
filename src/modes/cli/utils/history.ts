import { appendHistoryEntry, rawRequestBody } from '../../../core/services';
import type {
  HistoryEntryInput,
  HistoryRequestSnapshot,
  RequestBody,
  RequestOptions,
  ResponseState,
} from '../../../core/types';
import type { CliResponseProtocol } from '../types';

export interface CliHistoryMetadata {
  protocol: CliResponseProtocol;
  collectionId?: string;
  requestId?: string;
  requestName?: string;
}

function rawBodyContent(body: RequestBody | undefined): string {
  return body?.mode === 'raw' ? body.content : '';
}

function buildGraphqlRequestSnapshot(request: RequestOptions): HistoryRequestSnapshot {
  const content = rawBodyContent(request.body);

  try {
    const parsed = JSON.parse(content) as { query?: unknown; variables?: unknown };
    const query = typeof parsed.query === 'string' ? parsed.query : content;

    return {
      method: 'POST',
      url: request.url,
      headers: request.headers ?? {},
      body: rawRequestBody(query),
      variables:
        parsed.variables === undefined
          ? undefined
          : typeof parsed.variables === 'string'
            ? parsed.variables
            : JSON.stringify(parsed.variables, null, 2),
      auth: request.auth,
      scripts: request.scripts,
    };
  } catch {
    return {
      method: 'POST',
      url: request.url,
      headers: request.headers ?? {},
      body: request.body,
      auth: request.auth,
      scripts: request.scripts,
    };
  }
}

function buildRequestSnapshot(
  request: RequestOptions,
  protocol: CliResponseProtocol,
): HistoryRequestSnapshot {
  if (protocol === 'graphql') {
    return buildGraphqlRequestSnapshot(request);
  }

  return {
    method: request.method,
    url: request.url,
    headers: request.headers ?? {},
    body: request.body,
    auth: request.auth,
    scripts: request.scripts,
  };
}

export async function appendCliHistoryEntry(
  request: RequestOptions,
  response: ResponseState,
  metadata: CliHistoryMetadata,
): Promise<void> {
  const isSse = metadata.protocol === 'sse' || response.mode === 'sse';
  const startedAt = response.streamStartedAt;
  const endedAt = response.streamEndedAt;
  const entry: HistoryEntryInput = {
    protocol: metadata.protocol === 'graphql' ? 'graphql' : 'rest',
    collectionId: metadata.collectionId,
    requestId: metadata.requestId,
    requestName: metadata.requestName,
    request: buildRequestSnapshot(request, metadata.protocol),
    response: {
      status: response.status,
      statusText: response.statusText,
      body: response.body,
      headers: response.headers,
      time: response.time,
      stats: response.stats,
      mode: isSse ? 'sse' : response.mode,
      scriptResults: response.scriptResults,
      sseSummary: isSse
        ? {
            eventCount: response.streamEventCount ?? response.sseEvents?.length ?? 0,
            droppedEvents: response.sseMeta?.droppedEvents ?? 0,
            durationMs: startedAt && endedAt ? Math.max(0, endedAt - startedAt) : response.time,
          }
        : undefined,
    },
  };

  await appendHistoryEntry(entry);
}
