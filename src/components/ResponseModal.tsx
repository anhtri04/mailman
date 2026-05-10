import { useState, useMemo, useCallback } from 'react';
import { useTheme } from '../theme/ThemeProvider';
import type { ResponseState } from '../types';
import { Modal } from './Modal';
import { SyntaxHighlighter } from './SyntaxHighlighter';
import { HeadersDisplay } from './HeadersDisplay';
import { detectContentType, formatResponseBody } from '../utils/response-formatter';

type ResponseTab = 'body' | 'headers' | 'raw';

interface ResponseModalProps {
  response: ResponseState;
  onClose: () => void;
}

export function ResponseModal({ response, onClose }: ResponseModalProps) {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<ResponseTab>('body');

  const contentType = useMemo(() => {
    return detectContentType(response.headers, response.body);
  }, [response]);

  const formattedBody = useMemo(() => {
    return formatResponseBody(response.body, contentType);
  }, [response, contentType]);

  const contentSize = useMemo(() => {
    const bytes = new TextEncoder().encode(response.body).length;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }, [response]);

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
          onMouseDown={(e: { stopPropagation: () => void }) => {
            e.stopPropagation();
            setActiveTab(tab);
          }}
        >
          <text fg={isActive ? colors.accent.primary : colors.text.muted}>
            {isActive ? <strong>{label}</strong> : label}
          </text>
        </box>
      );
    },
    [activeTab],
  );

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Response - ${response.status} ${response.statusText}`}
    >
      <box style={{ flexDirection: 'column', flexGrow: 1 }}>
        <box style={{ flexDirection: 'row', gap: 2, marginBottom: 1 }}>
          <text fg={colors.text.muted}>{contentSize}</text>
          <text fg={colors.text.muted}>{response.time}ms</text>
        </box>

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
  );
}
