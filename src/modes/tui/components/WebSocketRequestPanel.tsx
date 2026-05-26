import { useState, useEffect } from 'react';
import { useTheme } from '../../../shared/theme/ThemeProvider';

type ActiveTab = 'headers' | null;
type ActiveEditor = 'url' | 'message' | null;

interface WebSocketRequestPanelProps {
  focused: boolean;
  onFocus: () => void;
  url: string;
  onUrlChange: (url: string) => void;
  message: string;
  onMessageChange: (message: string) => void;
  headers: Record<string, string>;
  onOpenHeaders: () => void;
  onConnect: () => void;
  onSendMessage: () => void;
  onDisconnect: () => void;
  connected: boolean;
  requestName?: string;
  saveStatus?: 'idle' | 'saved' | 'error';
  isModalOpen?: boolean;
}

export function WebSocketRequestPanel({
  focused,
  onFocus,
  url,
  onUrlChange,
  message,
  onMessageChange,
  headers,
  onOpenHeaders,
  onConnect,
  onSendMessage,
  onDisconnect,
  connected,
  requestName,
  saveStatus = 'idle',
  isModalOpen = false,
}: WebSocketRequestPanelProps) {
  const { colors } = useTheme();
  const [activeEditor, setActiveEditor] = useState<ActiveEditor>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>(null);
  const hasHeaders = Object.keys(headers).length > 0;
  const urlFocused = focused && activeEditor === 'url';
  const messageFocused = focused && activeEditor === 'message';

  useEffect(() => {
    if (!isModalOpen) {
      setActiveTab(null);
    }
  }, [isModalOpen]);

  return (
    <box
      style={{
        flexDirection: 'column',
        border: true,
        borderColor: focused ? colors.accent.primary : colors.border.default,
        borderStyle: 'rounded',
        padding: 1,
        flexGrow: 1,
        gap: 1,
      }}
      onMouseDown={() => {
        setActiveEditor(null);
        onFocus();
      }}
    >
      <box style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: -2 }}>
        <text
          fg={colors.accent.primary}
          bg={colors.bg.app}
          style={{ paddingLeft: 1, paddingRight: 1 }}
        >
          <strong> WebSocket </strong>
        </text>
        <box style={{ flexDirection: 'row', gap: 1 }}>
          {requestName && (
            <text fg={colors.text.muted} bg={colors.bg.app}>
              {requestName}
            </text>
          )}
          {saveStatus === 'saved' && (
            <text fg="#44cc88" bg={colors.bg.app}>
              Saved ✓
            </text>
          )}
          {saveStatus === 'error' && (
            <text fg="#cc4444" bg={colors.bg.app}>
              Save failed
            </text>
          )}
        </box>
      </box>

      <box style={{ flexDirection: 'row', gap: 1 }}>
        <box
          style={{
            border: true,
            borderColor: urlFocused ? colors.accent.primary : colors.border.default,
            borderStyle: 'rounded',
            paddingLeft: 1,
            paddingRight: 1,
            flexGrow: 1,
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            setActiveEditor('url');
            onFocus();
          }}
        >
          <input
            placeholder="wss://example.com/socket"
            value={url}
            onInput={onUrlChange}
            focused={urlFocused}
          />
        </box>
      </box>

      <box style={{ flexDirection: 'row', gap: 1 }}>
        <box
          style={{
            border: true,
            borderColor: activeTab === 'headers' ? colors.accent.primary : colors.border.default,
            borderStyle: 'rounded',
            paddingLeft: 2,
            paddingRight: 2,
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            setActiveEditor(null);
            if (activeTab === 'headers') {
              setActiveTab(null);
            } else {
              setActiveTab('headers');
              onOpenHeaders();
            }
            onFocus();
          }}
        >
          <text
            fg={
              activeTab === 'headers'
                ? colors.accent.primary
                : hasHeaders
                  ? colors.accent.primary
                  : colors.text.muted
            }
          >
            Headers{hasHeaders ? ' ●' : ''}
          </text>
        </box>

        <box
          style={{
            border: true,
            borderColor: connected ? colors.border.default : colors.accent.primary,
            borderStyle: 'rounded',
            paddingLeft: 2,
            paddingRight: 2,
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            setActiveEditor(null);
            connected ? onDisconnect() : onConnect();
          }}
        >
          <text fg={connected ? colors.syntax.error : colors.accent.primary}>
            <strong>{connected ? 'Disconnect' : 'Connect'}</strong>
          </text>
        </box>

        {connected && (
          <box
            style={{
              border: true,
              borderColor: colors.accent.primary,
              borderStyle: 'rounded',
              paddingLeft: 2,
              paddingRight: 2,
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              setActiveEditor(null);
              onSendMessage();
            }}
          >
            <text fg={colors.accent.primary}>
              <strong>Send</strong>
            </text>
          </box>
        )}
      </box>

      <text fg={colors.text.muted}>{connected ? 'Message to send:' : 'Initial message:'}</text>
      <box
        style={{
          border: true,
          borderColor: messageFocused ? colors.accent.primary : colors.border.default,
          borderStyle: 'rounded',
          paddingLeft: 1,
          paddingRight: 1,
          flexGrow: 1,
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          setActiveEditor('message');
          onFocus();
        }}
      >
        <input
          placeholder="Message payload..."
          value={message}
          onInput={onMessageChange}
          focused={messageFocused}
        />
      </box>
    </box>
  );
}
