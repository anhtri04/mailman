import { useTheme } from '../../../shared/theme/ThemeProvider';
import type { InputSuggestion } from '../parser/suggestions';

interface InputSuggestionPanelProps {
  visible: boolean;
  suggestions: InputSuggestion[];
  selectedIndex: number;
}

export function InputSuggestionPanel({
  visible,
  suggestions,
  selectedIndex,
}: InputSuggestionPanelProps) {
  const { colors } = useTheme();
  if (!visible) return null;

  return (
    <box
      style={{
        flexDirection: 'column',
        border: true,
        borderStyle: 'rounded',
        borderColor: colors.border.default,
        paddingLeft: 1,
        paddingRight: 1,
        paddingTop: 0.5,
        paddingBottom: 0.5,
        maxHeight: 8,
      }}
    >
      <scrollbox style={{ flexGrow: 1 }}>
        <box style={{ flexDirection: 'column' }}>
          {suggestions.map((suggestion, index) => (
            <text
              key={suggestion.id}
              fg={index === selectedIndex ? colors.accent.text : colors.text.primary}
              bg={index === selectedIndex ? colors.accent.primary : undefined}
            >
              {suggestion.label}
              {suggestion.detail ? ` - ${suggestion.detail}` : ''}
            </text>
          ))}
        </box>
      </scrollbox>
    </box>
  );
}
