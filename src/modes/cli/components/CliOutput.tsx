import { useTheme } from '../../../shared/theme/ThemeProvider';
import { CliResponseOutput } from './CliResponseOutput';
import type { CliOutputEntry, CliViewToggles } from '../types';

interface CliOutputProps {
  outputs: CliOutputEntry[];
  toggles: CliViewToggles;
}

export function CliOutput({ outputs, toggles }: CliOutputProps) {
  const { colors } = useTheme();

  return (
    <box
      style={{
        flexDirection: 'column',
        flexGrow: 1,
        border: true,
        borderStyle: 'rounded',
        borderColor: colors.border.default,
        padding: 1,
      }}
    >
      <box style={{ marginTop: -2 }}>
        <text fg={colors.accent.primary} style={{ paddingLeft: 1, paddingRight: 1 }}>
          <strong> Output </strong>
        </text>
      </box>
      <scrollbox style={{ flexGrow: 1 }}>
        <box style={{ flexDirection: 'column', gap: 1 }}>
          {outputs.length === 0 ? (
            <text fg={colors.text.muted}>
              Type /help or enter a request like GET https://httpbin.org/get
            </text>
          ) : (
            outputs.map((entry) => (
              <box key={entry.id} style={{ flexDirection: 'column' }}>
                {entry.kind === 'response' ? (
                  <CliResponseOutput
                    response={entry.response}
                    request={entry.request}
                    toggles={toggles}
                  />
                ) : (
                  <text fg={entry.kind === 'error' ? colors.syntax.error : colors.text.primary}>
                    {entry.content}
                  </text>
                )}
              </box>
            ))
          )}
        </box>
      </scrollbox>
    </box>
  );
}
