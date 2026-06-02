import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useTheme } from '../../../shared/theme/ThemeProvider';
import { formatBytes } from '../../../core/services';
import { detectContentType, formatResponseBody } from '../../../shared/utils/response-formatter';
import { SyntaxHighlighter } from '../../tui/components/SyntaxHighlighter';
import { JsonTreeViewer } from '../../../shared/components/JsonTreeViewer';
import { canRenderJsonTree } from '../../../shared/utils/json-tree';
import type { ContentType } from '../../../shared/utils/response-formatter';
import type { ResponseState, SSEEvent } from '../../../core/types';
import type { CliResponseProtocol, CliResponseSectionId, CliViewToggles } from '../types';

interface CliResponseOutputProps {
  id: string;
  response: ResponseState;
  request: {
    protocol: CliResponseProtocol;
    method: string;
    url: string;
  };
  toggles: CliViewToggles;
  focused: boolean;
  selectedSectionId: CliResponseSectionId | null;
  onFocus: () => void;
  onSectionFocus: (sectionId: CliResponseSectionId) => void;
  onToggleSection: (sectionId: CliResponseSectionId, defaultCollapsed?: boolean) => void;
  isSectionCollapsed: (sectionId: CliResponseSectionId, defaultCollapsed?: boolean) => boolean;
}

interface ResponseSummaryProps {
  response: ResponseState;
  request: {
    protocol: CliResponseProtocol;
    method: string;
    url: string;
  };
  toggles: CliViewToggles;
  contentType: ContentType;
  contentSize: string;
}

interface CliSectionNavigationProps {
  responseFocused: boolean;
  selectedSectionId: CliResponseSectionId | null;
  onSectionFocus: (sectionId: CliResponseSectionId) => void;
  onToggleSection: (sectionId: CliResponseSectionId, defaultCollapsed?: boolean) => void;
  isSectionCollapsed: (sectionId: CliResponseSectionId, defaultCollapsed?: boolean) => boolean;
}

function getStatusColor(status: number, colors: ReturnType<typeof useTheme>['colors']): string {
  if (status === 0) return colors.syntax.warning;
  if (status >= 200 && status < 300) return colors.syntax.success;
  if (status >= 300 && status < 400) return colors.syntax.warning;
  if (status >= 400) return colors.syntax.error;
  return colors.text.primary;
}

function protocolLabel(protocol: CliResponseProtocol, response: ResponseState): string {
  if (response.mode === 'sse') return 'SSE';
  if (protocol === 'graphql') return 'GraphQL';
  return 'REST';
}

function CollapsibleSection({
  id,
  title,
  children,
  collapsed,
  focused,
  summary,
  onFocus,
  onToggle,
}: {
  id: CliResponseSectionId;
  title: string;
  children: ReactNode;
  collapsed: boolean;
  focused: boolean;
  summary?: string;
  onFocus: (sectionId: CliResponseSectionId) => void;
  onToggle: (sectionId: CliResponseSectionId) => void;
}) {
  const { colors } = useTheme();

  return (
    <box style={{ flexDirection: 'column', marginTop: 1 }}>
      <box
        style={{
          flexDirection: 'row',
          gap: 1,
          backgroundColor: focused ? colors.bg.focusHighlight : 'transparent',
        }}
        onMouseDown={() => {
          onFocus(id);
          onToggle(id);
        }}
      >
        <text fg={focused ? colors.text.primary : colors.accent.primary}>
          {collapsed ? '▸' : '▾'}
        </text>
        <text fg={focused ? colors.text.primary : colors.accent.primary}>
          <strong>{title}</strong>
        </text>
        {summary && <text fg={focused ? colors.text.primary : colors.text.muted}>{summary}</text>}
      </box>
      {!collapsed && <box style={{ flexDirection: 'column', marginTop: 1 }}>{children}</box>}
    </box>
  );
}

function EmptyLine() {
  return <text> </text>;
}

function CliResponseSummary({ response, request, contentType, contentSize }: ResponseSummaryProps) {
  const { colors } = useTheme();
  const statusColor = getStatusColor(response.status, colors);
  const label = protocolLabel(request.protocol, response);
  const streaming = response.mode === 'sse' && response.isStreaming;

  return (
    <box style={{ flexDirection: 'column' }}>
      <box style={{ flexDirection: 'row' }}>
        <text fg={colors.text.muted}>{label} </text>
        <text fg={colors.accent.primary}>{request.method}</text>
        <text fg={colors.text.primary}> {request.url}</text>
      </box>
      <box style={{ flexDirection: 'row', gap: 2 }}>
        <text fg={statusColor}>
          ●{' '}
          {response.status > 0 ? `${response.status} ${response.statusText}` : response.statusText}
        </text>
        <text fg={colors.text.muted}>{streaming ? 'streaming' : `${response.time}ms`}</text>
        <text fg={colors.text.muted}>{contentType}</text>
        <text fg={colors.text.muted}>{contentSize}</text>
        {response.mode === 'sse' && (
          <text fg={colors.text.muted}>events: {response.streamEventCount ?? 0}</text>
        )}
      </box>
    </box>
  );
}

function CliHeadersBlock({ headers }: { headers: Record<string, string> }) {
  const { colors } = useTheme();
  const entries = Object.entries(headers);
  const labelWidth = Math.min(28, Math.max(0, ...entries.map(([key]) => key.length)));

  if (entries.length === 0) {
    return <text fg={colors.text.muted}>[no headers]</text>;
  }

  return (
    <box style={{ flexDirection: 'column' }}>
      {entries.map(([key, value]) => (
        <box key={key} style={{ flexDirection: 'row' }}>
          <text fg={colors.text.muted}>{key.padEnd(labelWidth + 2)}</text>
          <text fg={colors.text.primary}>{value}</text>
        </box>
      ))}
    </box>
  );
}

function CliMetaBlock({ response }: { response: ResponseState }) {
  const { colors } = useTheme();
  const stats = response.stats;

  if (!stats) {
    return <text fg={colors.text.muted}>[no timing metadata]</text>;
  }

  const rows: Array<[string, string]> = [
    ['TTFB', `${stats.timings.ttfbMs ?? '-'}ms`],
    ['Download', `${stats.timings.downloadMs ?? '-'}ms`],
    ['Request', formatBytes(stats.requestSize.totalBytes)],
    ['Response', formatBytes(stats.responseSize.totalBytes)],
    ['Network', `${stats.network.protocol}//${stats.network.host}`],
  ];

  return (
    <box style={{ flexDirection: 'column' }}>
      {rows.map(([label, value]) => (
        <box key={label} style={{ flexDirection: 'row' }}>
          <text fg={colors.text.muted}>{label.padEnd(12)}</text>
          <text fg={colors.text.primary}>{value}</text>
        </box>
      ))}
    </box>
  );
}

function CliBodyBlock({ body, contentType }: { body: string; contentType: ContentType }) {
  const { colors } = useTheme();
  const [collapsedJsonPaths, setCollapsedJsonPaths] = useState<Set<string>>(new Set());
  const formattedBody = useMemo(() => formatResponseBody(body, contentType), [body, contentType]);
  const shouldRenderJsonTree = useMemo(
    () => contentType === 'json' && canRenderJsonTree(body),
    [body, contentType],
  );

  useEffect(() => {
    setCollapsedJsonPaths(new Set());
  }, [body]);

  const handleToggleJsonPath = useCallback((path: string) => {
    setCollapsedJsonPaths((current) => {
      const next = new Set(current);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  if (!formattedBody) {
    return <text fg={colors.text.muted}>[empty body]</text>;
  }

  if (shouldRenderJsonTree) {
    return (
      <JsonTreeViewer
        body={body}
        collapsedPaths={collapsedJsonPaths}
        onTogglePath={handleToggleJsonPath}
      />
    );
  }

  return (
    <SyntaxHighlighter
      code={formattedBody}
      language={
        contentType === 'json' || contentType === 'xml' || contentType === 'html'
          ? contentType
          : 'text'
      }
    />
  );
}

function parseJsonObject(body: string): unknown {
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

function CliGraphQLBodyBlock({
  response,
  contentType,
  responseFocused,
  selectedSectionId,
  onSectionFocus,
  onToggleSection,
  isSectionCollapsed,
}: {
  response: ResponseState;
  contentType: ContentType;
} & CliSectionNavigationProps) {
  const parsed = parseJsonObject(response.body);
  const isRecord = parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed);
  const data = isRecord ? (parsed as Record<string, unknown>).data : undefined;
  const errors = isRecord ? (parsed as Record<string, unknown>).errors : undefined;

  if (!isRecord || (data === undefined && errors === undefined)) {
    return (
      <CollapsibleSection
        id="body"
        title="Body"
        collapsed={isSectionCollapsed('body')}
        focused={responseFocused && selectedSectionId === 'body'}
        onFocus={onSectionFocus}
        onToggle={(sectionId) => onToggleSection(sectionId)}
      >
        <CliBodyBlock body={response.body} contentType={contentType} />
      </CollapsibleSection>
    );
  }

  const errorCount = Array.isArray(errors) ? errors.length : errors === undefined ? 0 : 1;

  return (
    <box style={{ flexDirection: 'column' }}>
      <CollapsibleSection
        id="data"
        title="Data"
        collapsed={isSectionCollapsed('data')}
        focused={responseFocused && selectedSectionId === 'data'}
        onFocus={onSectionFocus}
        onToggle={(sectionId) => onToggleSection(sectionId)}
      >
        <CliBodyBlock body={JSON.stringify(data ?? null)} contentType="json" />
      </CollapsibleSection>
      <CollapsibleSection
        id="errors"
        title="Errors"
        collapsed={isSectionCollapsed('errors', errorCount === 0)}
        focused={responseFocused && selectedSectionId === 'errors'}
        summary={errorCount > 0 ? `${errorCount}` : '[none]'}
        onFocus={onSectionFocus}
        onToggle={(sectionId) => onToggleSection(sectionId, errorCount === 0)}
      >
        <CliBodyBlock body={JSON.stringify(errors ?? [])} contentType="json" />
      </CollapsibleSection>
    </box>
  );
}

function CliSseEventBlock({ event }: { event: SSEEvent }) {
  const { colors } = useTheme();
  const contentType = detectContentType({}, event.data);
  const [collapsed, setCollapsed] = useState(event.data.length > 800);

  return (
    <box
      style={{
        flexDirection: 'column',
        border: true,
        borderColor: colors.border.default,
        padding: 1,
        marginBottom: 1,
      }}
    >
      <box
        style={{ flexDirection: 'row', gap: 1 }}
        onMouseDown={() => setCollapsed((current) => !current)}
      >
        <text fg={colors.accent.primary}>{collapsed ? '▸' : '▾'}</text>
        <text fg={colors.accent.primary}>[{event.event ?? 'message'}]</text>
        {event.id && <text fg={colors.text.muted}>#{event.id}</text>}
        {event.retry !== undefined && <text fg={colors.text.muted}>retry: {event.retry}ms</text>}
        <text fg={colors.text.muted}>
          {formatBytes(new TextEncoder().encode(event.data).length)}
        </text>
      </box>
      {!collapsed && <CliBodyBlock body={event.data} contentType={contentType} />}
    </box>
  );
}

function CliSseResponseOutput({
  response,
  toggles,
  focused,
  selectedSectionId,
  onSectionFocus,
  onToggleSection,
  isSectionCollapsed,
}: CliResponseOutputProps) {
  const { colors } = useTheme();
  const events = response.sseEvents ?? [];
  const visibleEvents = events.slice(-20);
  const hiddenEventCount = Math.max(0, events.length - visibleEvents.length);

  return (
    <box style={{ flexDirection: 'column' }}>
      {toggles.showBody && (
        <CollapsibleSection
          id="events"
          title="Events"
          collapsed={isSectionCollapsed('events')}
          focused={focused && selectedSectionId === 'events'}
          summary={`${events.length}`}
          onFocus={onSectionFocus}
          onToggle={(sectionId) => onToggleSection(sectionId)}
        >
          {hiddenEventCount > 0 && (
            <text fg={colors.text.muted}>
              Showing latest {visibleEvents.length}; hidden older events: {hiddenEventCount}
            </text>
          )}
          {visibleEvents.length === 0 ? (
            <text fg={colors.text.muted}>No SSE events received yet.</text>
          ) : (
            visibleEvents.map((event, index) => (
              <CliSseEventBlock
                key={`${event.id ?? 'evt'}-${event.timestamp}-${index}`}
                event={event}
              />
            ))
          )}
        </CollapsibleSection>
      )}
      {toggles.showHeaders && (
        <CollapsibleSection
          id="headers"
          title="Headers"
          collapsed={isSectionCollapsed('headers', true)}
          focused={focused && selectedSectionId === 'headers'}
          summary={`${Object.keys(response.headers).length}`}
          onFocus={onSectionFocus}
          onToggle={(sectionId) => onToggleSection(sectionId, true)}
        >
          <CliHeadersBlock headers={response.headers} />
        </CollapsibleSection>
      )}
      {toggles.showMeta && (
        <>
          <CollapsibleSection
            id="streamMeta"
            title="Stream Meta"
            collapsed={isSectionCollapsed('streamMeta', true)}
            focused={focused && selectedSectionId === 'streamMeta'}
            onFocus={onSectionFocus}
            onToggle={(sectionId) => onToggleSection(sectionId, true)}
          >
            <box style={{ flexDirection: 'column' }}>
              <text fg={colors.text.primary}>
                Last Event ID {response.sseMeta?.lastEventId ?? '-'}
              </text>
              <text fg={colors.text.primary}>Retry {response.sseMeta?.retryMs ?? '-'}ms</text>
              <text fg={colors.text.primary}>Dropped {response.sseMeta?.droppedEvents ?? 0}</text>
            </box>
          </CollapsibleSection>
          <CollapsibleSection
            id="stats"
            title="Stats"
            collapsed={isSectionCollapsed('stats', true)}
            focused={focused && selectedSectionId === 'stats'}
            onFocus={onSectionFocus}
            onToggle={(sectionId) => onToggleSection(sectionId, true)}
          >
            <CliMetaBlock response={response} />
          </CollapsibleSection>
        </>
      )}
    </box>
  );
}

function CliStandardResponseOutput({
  response,
  request,
  toggles,
  contentType,
  focused,
  selectedSectionId,
  onSectionFocus,
  onToggleSection,
  isSectionCollapsed,
}: CliResponseOutputProps & { contentType: ContentType }) {
  const isGraphQL = request.protocol === 'graphql';

  return (
    <box style={{ flexDirection: 'column' }}>
      {toggles.showBody && (
        <>
          {isGraphQL ? (
            <CliGraphQLBodyBlock
              response={response}
              contentType={contentType}
              responseFocused={focused}
              selectedSectionId={selectedSectionId}
              onSectionFocus={onSectionFocus}
              onToggleSection={onToggleSection}
              isSectionCollapsed={isSectionCollapsed}
            />
          ) : (
            <CollapsibleSection
              id="body"
              title="Body"
              collapsed={isSectionCollapsed('body')}
              focused={focused && selectedSectionId === 'body'}
              onFocus={onSectionFocus}
              onToggle={(sectionId) => onToggleSection(sectionId)}
            >
              <CliBodyBlock body={response.body} contentType={contentType} />
            </CollapsibleSection>
          )}
        </>
      )}
      {toggles.showHeaders && (
        <CollapsibleSection
          id="headers"
          title="Headers"
          collapsed={isSectionCollapsed('headers', true)}
          focused={focused && selectedSectionId === 'headers'}
          summary={`${Object.keys(response.headers).length}`}
          onFocus={onSectionFocus}
          onToggle={(sectionId) => onToggleSection(sectionId, true)}
        >
          <CliHeadersBlock headers={response.headers} />
        </CollapsibleSection>
      )}
      {toggles.showMeta && (
        <CollapsibleSection
          id="stats"
          title="Stats"
          collapsed={isSectionCollapsed('stats', true)}
          focused={focused && selectedSectionId === 'stats'}
          onFocus={onSectionFocus}
          onToggle={(sectionId) => onToggleSection(sectionId, true)}
        >
          <CliMetaBlock response={response} />
        </CollapsibleSection>
      )}
    </box>
  );
}

export function CliResponseOutput(props: CliResponseOutputProps) {
  const { response, request, toggles, focused, onFocus } = props;
  const { colors } = useTheme();
  const contentType = useMemo(() => detectContentType(response.headers, response.body), [response]);
  const contentSize = useMemo(
    () => formatBytes(new TextEncoder().encode(response.body).length),
    [response.body],
  );

  return (
    <box
      style={{
        flexDirection: 'column',
        border: true,
        borderColor: focused ? colors.accent.primary : colors.border.default,
        borderStyle: 'rounded',
        padding: 1,
      }}
      onMouseDown={onFocus}
    >
      <CliResponseSummary
        response={response}
        request={request}
        toggles={toggles}
        contentType={contentType}
        contentSize={contentSize}
      />
      <EmptyLine />
      {response.mode === 'sse' ? (
        <CliSseResponseOutput {...props} />
      ) : (
        <CliStandardResponseOutput {...props} contentType={contentType} />
      )}
    </box>
  );
}
