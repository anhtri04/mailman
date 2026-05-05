import { useState, useMemo, useCallback } from 'react';
import { useKeyboard } from '@opentui/react';
import { colors } from '../theme/colors';
import type { ResponseState } from '../types';
import { Modal } from './Modal';
import { SyntaxHighlighter } from './SyntaxHighlighter';
import { HeadersDisplay } from './HeadersDisplay';
import { detectContentType, formatResponseBody } from '../utils/response-formatter';

type ResponseTab = 'body' | 'headers' | 'raw';

interface ResponsePanelProps {
  focused: boolean;
  onFocus: () => void;
  response: ResponseState | null;
}

const TABS: ResponseTab[] = ['body', 'headers', 'raw'];

export function ResponsePanel({ focused, onFocus, response }: ResponsePanelProps) {
  const borderColor = focused ? colors.accent.primary : colors.border.default;
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<ResponseTab>('body');

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
      setIsExpanded(true);
    } else if (key.name === 'escape' && isExpanded) {
      setIsExpanded(false);
    } else if (focused && key.name === 'tab') {
      // Cycle through tabs
      const currentIndex = TABS.indexOf(activeTab);
      const nextIndex = (currentIndex + 1) % TABS.length;
      const nextTab = TABS[nextIndex];
      if (nextTab) {
        setActiveTab(nextTab);
      }
    }
  });

  const handleTabClick = useCallback(
    (tab: ResponseTab) => (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      setActiveTab(tab);
    },
    [],
  );

  const renderTabButton = useCallback(
    (tab: ResponseTab, label: string) => {
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
            <box style={{ flexDirection: 'row', gap: 1 }}>
              {renderTabButton('body', 'Body')}
              {renderTabButton('headers', 'Headers')}
              {renderTabButton('raw', 'Raw')}
            </box>

            {/* Tab Content */}
            <box style={{ flexGrow: 1, marginTop: 1 }}>
              {activeTab === 'body' && (
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
            </box>

            <text fg={colors.text.dim} style={{ marginTop: 1 }}>
              Press SPACE to expand • TAB to switch tabs
            </text>
          </box>
        ) : (
          <text fg={colors.text.dim}>No response yet. Send a request to see results.</text>
        )}
      </box>

      {isExpanded && response && (
        <Modal
          isOpen={true}
          onClose={() => setIsExpanded(false)}
          title={`Response - ${response.status} ${response.statusText}`}
        >
          <box style={{ flexDirection: 'column', flexGrow: 1 }}>
            <box style={{ flexDirection: 'row', gap: 2, marginBottom: 1 }}>
              <text fg={colors.text.muted}>{contentSize}</text>
              <text fg={colors.text.muted}>{response.time}ms</text>
              <text fg={colors.text.muted}>• Press ESC to close</text>
            </box>

            {/* Tabs in modal */}
            <box style={{ flexDirection: 'row', gap: 1, marginBottom: 1 }}>
              {renderTabButton('body', 'Body')}
              {renderTabButton('headers', 'Headers')}
              {renderTabButton('raw', 'Raw')}
            </box>

            <scrollbox style={{ flexGrow: 1 }}>
              {activeTab === 'body' && (
                <SyntaxHighlighter
                  code={formattedBody}
                  language={
                    contentType === 'json' || contentType === 'xml' || contentType === 'html'
                      ? contentType
                      : 'text'
                  }
                />
              )}

              {activeTab === 'headers' && response.headers && (
                <HeadersDisplay headers={response.headers} />
              )}

              {activeTab === 'raw' && <text fg={colors.text.primary}>{response.body}</text>}
            </scrollbox>
          </box>
        </Modal>
      )}
    </box>
  );
}
