import { useMemo, useCallback } from 'react';
import { useKeyboard } from '@opentui/react';
import { useTheme } from '../../../shared/theme/ThemeProvider';
import type { ResponseState } from '../../../types';
import type { RestResponseTab, SseResponseTab } from '../../../shared/utils/responseCopyUtility';
import { SyntaxHighlighter } from './SyntaxHighlighter';
import { HeadersDisplay } from './HeadersDisplay';
import { detectContentType, formatResponseBody } from '../../../shared/utils/response-formatter';
import { MailmanLogo } from './MailmanLogo';
import { ScriptResultsPanel } from './ScriptResultsPanel';

interface ResponsePanelProps {
  focused: boolean;
  onFocus: () => void;
  response: ResponseState | null;
  isExpanded: boolean;
  onToggleExpand: (expanded: boolean) => void;
  onOpenStats?: () => void;
  onDisconnectStream?: () => void;
  onClearStream?: () => void;
  activeTab: RestResponseTab;
  onActiveTabChange: (tab: RestResponseTab) => void;
  activeSseTab: SseResponseTab;
  onActiveSseTabChange: (tab: SseResponseTab) => void;
  copyStatus?: 'idle' | 'copied' | 'error';
}

const TABS: RestResponseTab[] = ['body', 'headers', 'raw'];
const SSE_TABS: SseResponseTab[] = ['events', 'headers', 'raw'];

export function ResponsePanel({
  focused,
  onFocus,
  response,
  isExpanded,
  onToggleExpand,
  onOpenStats,
  onDisconnectStream,
  onClearStream,
  activeTab,
  onActiveTabChange,
  activeSseTab,
  onActiveSseTabChange,
  copyStatus = 'idle',
}: ResponsePanelProps) {
  const { colors } = useTheme();
  const borderColor = focused ? colors.accent.primary : colors.border.default;
  const isSSEMode = response?.mode === 'sse';
  const hasScriptResults = !!(
    response?.scriptResults?.beforeRequest || response?.scriptResults?.afterResponse
  );
  const availableTabs: RestResponseTab[] = hasScriptResults ? [...TABS, 'test'] : TABS;

  const contentType = useMemo(() => {
    if (!response) return 'text';
    return detectContentType(response.headers, response.body);
  }, [response]);

  const formattedBody = useMemo(() => {
    if (!response) return '';
    return formatResponseBody(response.body, contentType);
  }, [response, contentType]);

  const contentSize = useMemo(() => {
    if (!response) return '0 B';
    const bytes = new TextEncoder().encode(response.body).length;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }, [response]);

  useKeyboard((key) => {
    if (key.name === 'space' && response && !isExpanded) {
      onToggleExpand(true);
    } else if (key.name === 'escape' && isExpanded) {
      onToggleExpand(false);
    } else if (focused && key.name === 'tab' && !isExpanded) {
      if (isSSEMode) {
        const currentIndex = SSE_TABS.indexOf(activeSseTab);
        const nextIndex = (currentIndex + 1) % SSE_TABS.length;
        const nextTab = SSE_TABS[nextIndex];
        if (nextTab) {
          onActiveSseTabChange(nextTab);
        }
      } else {
        const currentIndex = availableTabs.indexOf(activeTab);
        const nextIndex = (currentIndex + 1) % availableTabs.length;
        const nextTab = availableTabs[nextIndex];
        if (nextTab) {
          onActiveTabChange(nextTab);
        }
      }
    }
  });

  const handleTabClick = useCallback(
    (tab: RestResponseTab) => (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      onFocus();
      onActiveTabChange(tab);
    },
    [onFocus, onActiveTabChange],
  );

  const renderTabButton = useCallback(
    (tab: RestResponseTab, label: string) => {
      const isActive = activeTab === tab;
      return (
        <box
          style={{
            paddingLeft: 2,
            paddingRight: 2,
            paddingTop: 0.5,
            paddingBottom: 0.5,
            border: true,
            borderColor: isActive ? colors.accent.primary : colors.border.default,
          }}
          onMouseDown={handleTabClick(tab)}
        >
          <text fg={isActive ? colors.accent.primary : colors.text.muted}>
            {isActive ? <strong>{label}</strong> : label}
          </text>
        </box>
      );
    },
    [activeTab, handleTabClick],
  );

  const renderSseTabButton = useCallback(
    (tab: SseResponseTab, label: string) => {
      const isActive = activeSseTab === tab;
      return (
        <box
          style={{
            paddingLeft: 2,
            paddingRight: 2,
            paddingTop: 0.5,
            paddingBottom: 0.5,
            border: true,
            borderColor: isActive ? colors.accent.primary : colors.border.default,
          }}
          onMouseDown={(e: { stopPropagation: () => void }) => {
            e.stopPropagation();
            onFocus();
            onActiveSseTabChange(tab);
          }}
        >
          <text fg={isActive ? colors.accent.primary : colors.text.muted}>
            {isActive ? <strong>{label}</strong> : label}
          </text>
        </box>
      );
    },
    [activeSseTab, colors, onFocus, onActiveSseTabChange],
  );

  const getStatusColor = (status: number): string => {
    if (status === 0) return colors.syntax.warning; // Error/Network
    if (status >= 200 && status < 300) return colors.syntax.success; // Success
    if (status >= 300 && status < 400) return colors.syntax.warning; // Redirect
    if (status >= 400 && status < 500) return colors.syntax.error; // Client error
    if (status >= 500) return colors.syntax.error; // Server error
    return colors.text.primary;
  };

  return (
    <box
      style={{
        flexDirection: 'column',
        border: true,
        borderColor,
        padding: 1,
        flexGrow: 1,
        borderStyle: 'rounded',
      }}
      onMouseDown={onFocus}
    >
      <box style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: -2 }}>
        <text
          fg={colors.accent.primary}
          bg={colors.bg.app}
          style={{ paddingLeft: 1, paddingRight: 1 }}
        >
          <strong> Response </strong>
        </text>
        {response && (
          <box style={{ flexDirection: 'row', gap: 2 }}>
            {copyStatus === 'copied' && (
              <text fg="#44cc88" bg={colors.bg.app} style={{ paddingLeft: 1, paddingRight: 1 }}>
                Copy ✓
              </text>
            )}
            {copyStatus === 'error' && (
              <text fg="#cc4444" bg={colors.bg.app} style={{ paddingLeft: 1, paddingRight: 1 }}>
                Copy failed
              </text>
            )}
            {onOpenStats && (
              <box
                style={{ paddingLeft: 1, paddingRight: 1 }}
                onMouseDown={(e: { stopPropagation: () => void }) => {
                  e.stopPropagation();
                  onOpenStats();
                }}
              >
                <text fg={colors.accent.primary}>Stats</text>
              </box>
            )}
            {isSSEMode && response.isStreaming && (
              <text fg={colors.syntax.success}>Streaming...</text>
            )}
            {isSSEMode && (
              <text fg={colors.text.muted}>Events: {response.streamEventCount ?? 0}</text>
            )}
            <text fg={colors.text.muted}>{contentSize}</text>
            <text fg={colors.text.muted}>{response.time}ms</text>
            <text fg={getStatusColor(response.status)}>
              {response.status > 0
                ? `${response.status} ${response.statusText}`
                : response.statusText}
            </text>
          </box>
        )}
      </box>

      <box style={{ flexGrow: 1, marginTop: 1, flexDirection: 'column' }}>
        {response ? (
          <box style={{ flexDirection: 'column', flexGrow: 1 }}>
            {/* <box style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <text fg={getStatusColor(response.status)}>
                {response.status > 0
                  ? `${response.status} ${response.statusText}`
                  : response.statusText}
              </text>
            </box> */}

            {/* Tabs */}
            <box style={{ flexDirection: 'row', gap: 1, marginBottom: 1 }}>
              {isSSEMode ? (
                <>
                  {renderSseTabButton('events', 'Events')}
                  {renderSseTabButton('headers', 'Headers')}
                  {renderSseTabButton('raw', 'Raw')}
                  {response.isStreaming && (
                    <box
                      style={{
                        marginLeft: 1,
                        border: true,
                        borderColor: colors.syntax.warning,
                        paddingLeft: 1,
                        paddingRight: 1,
                        paddingTop: 0.5,
                        paddingBottom: 0.5,
                      }}
                      onMouseDown={(e: { stopPropagation: () => void }) => {
                        e.stopPropagation();
                        onDisconnectStream?.();
                      }}
                    >
                      <text fg={colors.syntax.warning}>Disconnect</text>
                    </box>
                  )}
                  <box
                    style={{
                      border: true,
                      borderColor: colors.border.default,
                      paddingLeft: 1,
                      paddingRight: 1,
                      paddingTop: 0.5,
                      paddingBottom: 0.5,
                    }}
                    onMouseDown={(e: { stopPropagation: () => void }) => {
                      e.stopPropagation();
                      onClearStream?.();
                    }}
                  >
                    <text fg={colors.text.muted}>Clear</text>
                  </box>
                </>
              ) : (
                <>
                  {renderTabButton('body', 'Body')}
                  {renderTabButton('headers', 'Headers')}
                  {renderTabButton('raw', 'Raw')}
                  {hasScriptResults && renderTabButton('test', 'Test')}
                </>
              )}
            </box>

            {/* Tab Content */}
            <box style={{ flexGrow: 1, marginTop: 1 }}>
              {!isSSEMode && activeTab === 'body' && (
                <scrollbox style={{ flexGrow: 1 }}>
                  <SyntaxHighlighter
                    code={formattedBody}
                    language={
                      contentType === 'json' || contentType === 'xml' || contentType === 'html'
                        ? contentType
                        : 'text'
                    }
                  />
                </scrollbox>
              )}

              {((!isSSEMode && activeTab === 'headers') ||
                (isSSEMode && activeSseTab === 'headers')) &&
                response.headers && (
                  <scrollbox style={{ flexGrow: 1 }}>
                    <HeadersDisplay headers={response.headers} />
                  </scrollbox>
                )}

              {((!isSSEMode && activeTab === 'raw') || (isSSEMode && activeSseTab === 'raw')) && (
                <scrollbox style={{ flexGrow: 1 }}>
                  <text fg={colors.text.primary}>{response.body}</text>
                </scrollbox>
              )}

              {!isSSEMode && activeTab === 'test' && (
                <scrollbox style={{ flexGrow: 1 }}>
                  <ScriptResultsPanel results={response.scriptResults} />
                </scrollbox>
              )}

              {isSSEMode && activeSseTab === 'events' && (
                <scrollbox style={{ flexGrow: 1 }}>
                  <box style={{ flexDirection: 'column' }}>
                    {(response.sseEvents ?? []).map((event, index) => (
                      <box
                        key={`${event.id ?? 'evt'}-${event.timestamp}-${index}`}
                        style={{
                          flexDirection: 'column',
                          border: true,
                          borderColor: colors.border.default,
                          padding: 1,
                          marginBottom: 1,
                        }}
                      >
                        <text fg={colors.text.muted}>
                          {event.event ?? 'message'} {event.id ? `#${event.id}` : ''}
                        </text>
                        <text fg={colors.text.primary}>{event.data}</text>
                      </box>
                    ))}
                    {(response.sseEvents ?? []).length === 0 && (
                      <text fg={colors.text.muted}>No SSE events received yet.</text>
                    )}
                    {(response.sseMeta?.droppedEvents ?? 0) > 0 && (
                      <text fg={colors.syntax.warning}>
                        Dropped older events: {response.sseMeta?.droppedEvents}
                      </text>
                    )}
                  </box>
                </scrollbox>
              )}
            </box>

            <text fg={colors.text.dim} style={{ marginTop: 1 }}>
              Press SPACE to expand • TAB to switch tabs
            </text>
          </box>
        ) : (
          <MailmanLogo />
        )}
      </box>
    </box>
  );
}
