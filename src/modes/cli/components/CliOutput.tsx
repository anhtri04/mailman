import { useTheme } from '../../../shared/theme/ThemeProvider';
import { CliResponseOutput } from './CliResponseOutput';
import type { CliOutputEntry, CliResponseSectionId, CliViewToggles } from '../types';

interface CliOutputProps {
  outputs: CliOutputEntry[];
  toggles: CliViewToggles;
  focused: boolean;
  selectedResponseId: string | null;
  selectedSectionId: CliResponseSectionId | null;
  onFocus: () => void;
  onResponseFocus: (responseId: string) => void;
  onSectionFocus: (sectionId: CliResponseSectionId) => void;
  onToggleSection: (
    responseId: string,
    sectionId: CliResponseSectionId,
    defaultCollapsed?: boolean,
  ) => void;
  isSectionCollapsed: (
    responseId: string,
    sectionId: CliResponseSectionId,
    defaultCollapsed?: boolean,
  ) => boolean;
}

export function CliOutput({
  outputs,
  toggles,
  focused,
  selectedResponseId,
  selectedSectionId,
  onFocus,
  onResponseFocus,
  onSectionFocus,
  onToggleSection,
  isSectionCollapsed,
}: CliOutputProps) {
  const { colors } = useTheme();

  return (
    <box
      style={{
        flexDirection: 'column',
        flexGrow: 1,
        flexShrink: 1,
        minHeight: 0,
        border: true,
        borderStyle: 'rounded',
        borderColor: focused ? colors.accent.primary : colors.border.default,
        padding: 1,
      }}
      onMouseDown={onFocus}
    >
      <box style={{ marginTop: -2, flexShrink: 0 }}>
        <text fg={colors.accent.primary} style={{ paddingLeft: 1, paddingRight: 1 }}>
          <strong> Output </strong>
        </text>
      </box>
      <scrollbox style={{ flexGrow: 1, flexShrink: 1, minHeight: 0 }}>
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
                    id={entry.id}
                    response={entry.response}
                    request={entry.request}
                    toggles={toggles}
                    focused={focused && selectedResponseId === entry.id}
                    selectedSectionId={
                      focused && selectedResponseId === entry.id ? selectedSectionId : null
                    }
                    onFocus={() => onResponseFocus(entry.id)}
                    onSectionFocus={onSectionFocus}
                    onToggleSection={(sectionId, defaultCollapsed) =>
                      onToggleSection(entry.id, sectionId, defaultCollapsed)
                    }
                    isSectionCollapsed={(sectionId, defaultCollapsed) =>
                      isSectionCollapsed(entry.id, sectionId, defaultCollapsed)
                    }
                  />
                ) : (
                  <text
                    fg={
                      entry.kind === 'error'
                        ? colors.syntax.error
                        : entry.kind === 'request'
                          ? colors.text.muted
                          : colors.text.primary
                    }
                  >
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
