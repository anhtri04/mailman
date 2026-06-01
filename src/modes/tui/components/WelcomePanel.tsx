import { useMemo, useState, useEffect } from 'react';
import { copyCurl } from '../../../shared/utils/curlUtility';
import { useTheme } from '../../../shared/theme/ThemeProvider';
import { MailmanLogo } from './MailmanLogo';
import type { Collection, RequestItem } from '../../../types';
import { summarizeRequestBody } from '../../../core/services';

interface WelcomePanelProps {
  collection?: Collection;
  onExportCollection?: (collection: Collection) => void;
}

function requestMethodLabel(request: RequestItem): string {
  if (request.protocol === 'graphql') return 'GQL';
  if (request.protocol === 'websocket') return 'WSS';
  return request.method.toUpperCase();
}

function requestBody(request: RequestItem): string {
  if (request.protocol === 'graphql') return request.query;
  if (request.protocol === 'websocket') return request.initialMessage;
  return request.body ? summarizeRequestBody(request.body) : '';
}

function buildMethodSummary(requests: RequestItem[]): string {
  const counts = new Map<string, number>();

  for (const req of requests) {
    const method = requestMethodLabel(req);
    counts.set(method, (counts.get(method) ?? 0) + 1);
  }

  return [...counts.entries()].map(([method, count]) => `${method} ${count}`).join(' | ');
}

export function WelcomePanel({ collection, onExportCollection }: WelcomePanelProps) {
  const { colors } = useTheme();
  const [copyStatus, setCopyStatus] = useState<'success' | 'fail' | 'idle'>('idle');
  const [lastCopiedRequestName, setLastCopiedRequestName] = useState<string>('');

  const methodSummary = useMemo(() => {
    if (!collection) return '';
    return buildMethodSummary(collection.requests);
  }, [collection]);

  useEffect(() => {
    if (copyStatus !== null) {
      const timer = setTimeout(() => setCopyStatus('idle'), 2000);
      return () => clearTimeout(timer);
    }
  }, [copyStatus]);

  const handleCopyCurl = async (request: RequestItem) => {
    if (request.protocol === 'websocket') {
      setLastCopiedRequestName(request.name || request.url);
      setCopyStatus('fail');
      return;
    }

    const copied = await copyCurl({
      protocol: request.protocol,
      method: request.protocol === 'rest' ? request.method : 'GET',
      url: request.url,
      headers: request.headers,
      body: requestBody(request),
      query: request.protocol === 'graphql' ? request.query : undefined,
      variables: request.protocol === 'graphql' ? request.variables : undefined,
    });

    setLastCopiedRequestName(request.name || request.url);
    setCopyStatus(copied ? 'success' : 'fail');
  };

  if (collection) {
    return (
      <box
        style={{
          flexDirection: 'column',
          border: true,
          borderColor: colors.border.default,
          padding: 1,
          flexGrow: 1,
          borderStyle: 'rounded',
          height: '100%',
        }}
      >
        <box style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1 }}>
          <text fg={colors.accent.primary}>
            <strong>{collection.name}</strong>
          </text>
          <box
            style={{
              border: true,
              borderColor: colors.border.default,
              borderStyle: 'rounded',
              paddingLeft: 1,
              paddingRight: 1,
              paddingTop: 0.5,
              paddingBottom: 0.5,
            }}
            onMouseDown={() => onExportCollection?.(collection)}
          >
            <text fg={colors.text.primary}>Export</text>
          </box>
        </box>
        <text fg={colors.text.muted} style={{ marginBottom: 1 }}>
          {collection.requests.length} requests{methodSummary ? ` | ${methodSummary}` : ''}
        </text>
        <box style={{ flexDirection: 'column', gap: 0 }}>
          <box>
            <scrollbox>
              {collection.requests.map((req) => {
                const label = requestMethodLabel(req);
                const body = requestBody(req);
                return (
                  <box
                    key={req.id}
                    style={{ flexDirection: 'row', justifyContent: 'space-between' }}
                  >
                    <box style={{ flexDirection: 'row', gap: 1 }}>
                      <text
                        fg={
                          colors.methods[label as keyof typeof colors.methods]?.text ??
                          colors.text.primary
                        }
                      >
                        {label}
                      </text>
                      <text fg={colors.text.primary}>{req.name || req.url}</text>
                      {'auth' in req && req.auth && req.auth.type !== 'none' && (
                        <text fg={colors.text.dim}>auth</text>
                      )}
                      {(req.scripts?.beforeRequest || req.scripts?.afterResponse) && (
                        <text fg={colors.text.dim}>scripts</text>
                      )}
                      {body && <text fg={colors.text.dim}>body</text>}
                    </box>
                    <box
                      style={{
                        border: true,
                        borderColor: colors.border.default,
                        borderStyle: 'rounded',
                        paddingLeft: 1,
                        paddingRight: 1,
                      }}
                      onMouseDown={() => {
                        void handleCopyCurl(req);
                      }}
                    >
                      <text fg={colors.text.muted}>cURL</text>
                    </box>
                  </box>
                );
              })}
              {collection.requests.length === 0 && (
                <text fg={colors.text.muted}>No requests in this collection</text>
              )}
            </scrollbox>
          </box>
          {copyStatus === 'success' && (
            <text fg="#44cc88" bg={colors.bg.app}>
              Copied cURL: {lastCopiedRequestName} ✓
            </text>
          )}
          {copyStatus === 'fail' && (
            <text fg="#cc4444" bg={colors.bg.app}>
              Failed to copy {lastCopiedRequestName}
            </text>
          )}
        </box>
      </box>
    );
  }

  return (
    <box
      style={{
        flexDirection: 'column',
        border: true,
        borderColor: colors.border.default,
        padding: 1,
        flexGrow: 1,
        borderStyle: 'rounded',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <MailmanLogo />

      <box style={{ flexDirection: 'row', gap: 10, width: '60%', justifyContent: 'space-between' }}>
        <box style={{ flexDirection: 'column', gap: 1, justifyContent: 'flex-start' }}>
          <text fg={colors.text.muted} style={{ marginTop: 1, marginBottom: 1 }}>
            Getting started:
          </text>
          <text fg={colors.text.primary}> ↑ / ↓ Navigate collections</text>
          <text fg={colors.text.primary}> Enter Open a collection or request</text>
          <text fg={colors.text.primary}> Tab Switch between panels</text>
          <text fg={colors.text.primary}> Esc Close modals / go back</text>
        </box>

        <box style={{ flexDirection: 'column', gap: 1, justifyContent: 'flex-start' }}>
          <text fg={colors.text.muted} style={{ marginTop: 1, marginBottom: 1 }}>
            Global shortcuts:
          </text>
          <text fg={colors.text.primary}> Ctrl+Q Quit application</text>
          <text fg={colors.text.primary}> Ctrl+T Change theme</text>
          <text fg={colors.text.primary}> Ctrl+S Save changes</text>
          <text fg={colors.text.primary}> Space Expand response (when focused)</text>
        </box>
      </box>

      <text fg={colors.text.dim} style={{ marginTop: 2 }}>
        Select a collection to view its requests
      </text>
    </box>
  );
}
