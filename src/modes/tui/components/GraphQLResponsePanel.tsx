import { useMemo, useCallback } from 'react';
import { useKeyboard } from '@opentui/react';
import { useTheme } from '../../../shared/theme/ThemeProvider';
import type { ResponseState } from '../../../types';
import type { GraphqlResponseTab } from '../../../shared/utils/responseCopyUtility';
import { SyntaxHighlighter } from './SyntaxHighlighter';
import { HeadersDisplay } from './HeadersDisplay';
import { MailmanLogo } from './MailmanLogo';

interface GraphQLResponsePanelProps {
  focused: boolean;
  onFocus: () => void;
  response: ResponseState | null;
  isExpanded: boolean;
  onToggleExpand: (expanded: boolean) => void;
  activeTab: GraphqlResponseTab;
  onActiveTabChange: (tab: GraphqlResponseTab) => void;
  copyStatus?: 'idle' | 'copied' | 'error';
}

const TABS: GraphqlResponseTab[] = ['body', 'headers', 'raw', 'errors'];

export function GraphQLResponsePanel({
  focused,
  onFocus,
  response,
  isExpanded,
  onToggleExpand,
  activeTab,
  onActiveTabChange,
  copyStatus = 'idle',
}: GraphQLResponsePanelProps) {
  const { colors } = useTheme();
  const borderColor = focused ? colors.accent.primary : colors.border.default;

  const parsedBody = useMemo(() => {
    if (!response) return null;
    try {
      return JSON.parse(response.body);
    } catch {
      return null;
    }
  }, [response]);

  const graphqlErrors = useMemo(() => {
    if (!parsedBody || !Array.isArray(parsedBody.errors)) return [];
    return parsedBody.errors as Array<{
      message: string;
      path?: (string | number)[];
      locations?: Array<{ line: number; column: number }>;
    }>;
  }, [parsedBody]);

  const formattedBody = useMemo(() => {
    if (!response) return '';
    if (parsedBody) {
      return JSON.stringify(parsedBody, null, 2);
    }
    return response.body;
  }, [response, parsedBody]);

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
      const currentIndex = TABS.indexOf(activeTab);
      const nextIndex = (currentIndex + 1) % TABS.length;
      const nextTab = TABS[nextIndex];
      if (nextTab) {
        onActiveTabChange(nextTab);
      }
    }
  });

  const handleTabClick = useCallback(
    (tab: GraphqlResponseTab) => (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      onActiveTabChange(tab);
    },
    [onActiveTabChange],
  );

  const renderTabButton = useCallback(
    (tab: GraphqlResponseTab, label: string) => {
      const isActive = activeTab === tab;
      const hasErrors = tab === 'errors' && graphqlErrors.length > 0;
      const displayLabel = hasErrors ? `${label} (${graphqlErrors.length})` : label;
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
          <text
            fg={
              isActive ? colors.accent.primary : hasErrors ? colors.syntax.error : colors.text.muted
            }
          >
            {isActive ? <strong>{displayLabel}</strong> : displayLabel}
          </text>
        </box>
      );
    },
    [activeTab, handleTabClick, graphqlErrors, colors],
  );

  const getStatusColor = (status: number): string => {
    if (status === 0) return colors.syntax.warning;
    if (status >= 200 && status < 300) return colors.syntax.success;
    if (status >= 300 && status < 400) return colors.syntax.warning;
    if (status >= 400 && status < 500) return colors.syntax.error;
    if (status >= 500) return colors.syntax.error;
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
            <box style={{ flexDirection: 'row', gap: 1, marginBottom: 1 }}>
              {renderTabButton('body', 'Body')}
              {renderTabButton('headers', 'Headers')}
              {renderTabButton('raw', 'Raw')}
              {renderTabButton('errors', 'Errors')}
            </box>

            <box style={{ flexGrow: 1, marginTop: 1 }}>
              {activeTab === 'body' && (
                <scrollbox style={{ flexGrow: 1 }}>
                  <SyntaxHighlighter code={formattedBody} language="json" />
                </scrollbox>
              )}

              {activeTab === 'headers' && response.headers && (
                <scrollbox style={{ flexGrow: 1 }}>
                  <HeadersDisplay headers={response.headers} />
                </scrollbox>
              )}

              {activeTab === 'raw' && (
                <scrollbox style={{ flexGrow: 1 }}>
                  <text fg={colors.text.primary}>{response.body}</text>
                </scrollbox>
              )}

              {activeTab === 'errors' && (
                <scrollbox style={{ flexGrow: 1 }}>
                  {graphqlErrors.length > 0 ? (
                    <box style={{ flexDirection: 'column', gap: 1 }}>
                      {graphqlErrors.map((error, index) => (
                        <box
                          key={index}
                          style={{
                            flexDirection: 'column',
                            border: true,
                            borderColor: colors.syntax.error,
                            padding: 1,
                            marginBottom: 1,
                          }}
                        >
                          <text fg={colors.syntax.error}>
                            <strong>{error.message}</strong>
                          </text>
                          {error.path && (
                            <text fg={colors.text.muted} style={{ marginTop: 0.5 }}>
                              Path: {error.path.join('.')}
                            </text>
                          )}
                          {error.locations && error.locations.length > 0 && (
                            <text fg={colors.text.muted} style={{ marginTop: 0.5 }}>
                              Location: line {error.locations[0]!.line}, column{' '}
                              {error.locations[0]!.column}
                            </text>
                          )}
                        </box>
                      ))}
                    </box>
                  ) : parsedBody ? (
                    <text fg={colors.syntax.success}>No GraphQL errors found.</text>
                  ) : (
                    <text fg={colors.text.muted}>Unable to parse response as JSON.</text>
                  )}
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
