import { useMemo } from 'react';
import { useTheme } from '../../../shared/theme/ThemeProvider';
import type { ResponseState, ProtocolMessage } from '../../../types';

interface WebSocketResponsePanelProps {
  focused: boolean;
  onFocus: () => void;
  response: ResponseState | null;
  onClearMessages: () => void;
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString();
}

function directionSymbol(direction: ProtocolMessage['direction']): string {
  if (direction === 'inbound') return '←';
  if (direction === 'outbound') return '→';
  return '•';
}

export function WebSocketResponsePanel({
  focused,
  onFocus,
  response,
  onClearMessages,
}: WebSocketResponsePanelProps) {
  const { colors } = useTheme();
  const messages = response?.messages ?? [];
  const duration = useMemo(() => {
    if (!response?.streamStartedAt) return 0;
    return (response.streamEndedAt ?? Date.now()) - response.streamStartedAt;
  }, [response?.streamEndedAt, response?.streamStartedAt, messages.length]);

  return (
    <box
      style={{
        flexDirection: 'column',
        border: true,
        borderColor: focused ? colors.accent.primary : colors.border.default,
        borderStyle: 'rounded',
        padding: 1,
        flexGrow: 1,
      }}
      onMouseDown={onFocus}
    >
      <box style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: -2 }}>
        <text
          fg={colors.accent.primary}
          bg={colors.bg.app}
          style={{ paddingLeft: 1, paddingRight: 1 }}
        >
          <strong> Messages </strong>
        </text>
        <box style={{ flexDirection: 'row', gap: 1 }}>
          <text
            fg={response?.isStreaming ? colors.syntax.success : colors.text.muted}
            bg={colors.bg.app}
          >
            {response?.statusText ?? 'IDLE'}
          </text>
          <box
            style={{
              border: true,
              borderColor: colors.border.default,
              borderStyle: 'rounded',
              paddingLeft: 1,
              paddingRight: 1,
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              onClearMessages();
            }}
          >
            <text fg={colors.text.muted}>Clear</text>
          </box>
        </box>
      </box>

      <box style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1 }}>
        <text fg={colors.text.muted}>{messages.length} messages</text>
        <text fg={colors.text.muted}>{duration}ms</text>
      </box>

      <scrollbox style={{ flexGrow: 1 }}>
        <box style={{ flexDirection: 'column', gap: 0, backgroundColor: colors.bg.panel }}>
          {messages.map((message) => {
            const fg =
              message.direction === 'inbound'
                ? colors.syntax.success
                : message.direction === 'outbound'
                  ? colors.accent.primary
                  : colors.text.muted;
            return (
              <box key={message.id} style={{ flexDirection: 'column', marginBottom: 1 }}>
                <text fg={fg}>
                  {directionSymbol(message.direction)} [{formatTime(message.timestamp)}]{' '}
                  {message.direction}
                </text>
                <text fg={colors.text.primary}>{message.data}</text>
              </box>
            );
          })}
          {messages.length === 0 && <text fg={colors.text.muted}>No WebSocket messages yet.</text>}
        </box>
      </scrollbox>
    </box>
  );
}
