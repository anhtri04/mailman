import { useTheme } from '../theme/ThemeProvider';
import { MailmanLogo } from './MailmanLogo';
import type { Collection } from '../types';

interface WelcomePanelProps {
  collection?: Collection;
}

export function WelcomePanel({ collection }: WelcomePanelProps) {
  const { colors } = useTheme();

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
        <text fg={colors.accent.primary} style={{ marginBottom: 1 }}>
          <strong>{collection.name}</strong>
        </text>
        <box style={{ flexDirection: 'column', gap: 0 }}>
          {collection.requests.map((req) => (
            <box key={req.id} style={{ flexDirection: 'row', gap: 1 }}>
              <text
                fg={
                  colors.methods[req.method.toUpperCase() as keyof typeof colors.methods]?.text ??
                  colors.text.primary
                }
              >
                {req.method}
              </text>
              <text fg={colors.text.primary}>{req.name || req.url}</text>
            </box>
          ))}
          {collection.requests.length === 0 && (
            <text fg={colors.text.muted}>No requests in this collection</text>
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
