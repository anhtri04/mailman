import { useState, useMemo, useCallback } from 'react';
import { useKeyboard } from '@opentui/react';
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
  const borderColor = focused ? '#CC8844' : '#555555';
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
            border: true,
            borderColor: isActive ? '#CC8844' : '#555555',
            backgroundColor: isActive ? '#CC8844' : undefined,
          }}
          onMouseDown={handleTabClick(tab)}
        >
          <text fg={isActive ? '#000000' : '#999999'}>
            {isActive ? <strong>{label}</strong> : label}
          </text>
        </box>
      );
    },
    [activeTab, handleTabClick],
  );

  const getStatusColor = (status: number): string => {
    if (status === 0) return '#CC8844'; // Error/Network
    if (status >= 200 && status < 300) return '#99AA77'; // Success
    if (status >= 300 && status < 400) return '#BBAA77'; // Redirect
    if (status >= 400 && status < 500) return '#AA7733'; // Client error
    if (status >= 500) return '#AA5555'; // Server error
    return '#FFFFFF';
  };

  return (
    <box
      style={{
        flexDirection: 'column',
        border: true,
        borderColor,
        padding: 1,
        flexGrow: 1,
      }}
      onMouseDown={onFocus}
    >
      <box style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <text fg="#CC8844">
          <strong>Response</strong>
        </text>
        {response && (
          <box style={{ flexDirection: 'row', gap: 2 }}>
            <text fg="#999999">{contentSize}</text>
            <text fg="#999999">{response.time}ms</text>
          </box>
        )}
      </box>

      <box style={{ flexGrow: 1, marginTop: 1, flexDirection: 'column' }}>
        {response ? (
          <box style={{ flexDirection: 'column', flexGrow: 1 }}>
            <box style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <text fg={getStatusColor(response.status)}>
                {response.status > 0
                  ? `${response.status} ${response.statusText}`
                  : response.statusText}
              </text>
            </box>

            {/* Tabs */}
            <box style={{ flexDirection: 'row', gap: 1, marginTop: 1 }}>
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
                    language={contentType === 'json' || contentType === 'xml' || contentType === 'html' ? contentType : 'text'}
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
                  <text fg="#FFFFFF">{response.body}</text>
                </scrollbox>
              )}
            </box>

            <text fg="#666666" style={{ marginTop: 1 }}>
              Press SPACE to expand • TAB to switch tabs
            </text>
          </box>
        ) : (
          <text fg="#666666">No response yet. Send a request to see results.</text>
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
              <text fg="#999999">{contentSize}</text>
              <text fg="#999999">{response.time}ms</text>
              <text fg="#999999">• Press ESC to close</text>
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
                  language={contentType === 'json' || contentType === 'xml' || contentType === 'html' ? contentType : 'text'}
                />
              )}

              {activeTab === 'headers' && response.headers && (
                <HeadersDisplay headers={response.headers} />
              )}

              {activeTab === 'raw' && <text fg="#FFFFFF">{response.body}</text>}
            </scrollbox>
          </box>
        </Modal>
      )}
    </box>
  );
}
