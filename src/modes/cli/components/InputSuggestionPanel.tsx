import { useTheme } from '../../../shared/theme/ThemeProvider';
import { getListViewport } from '../../../shared/utils';
import type { InputSuggestion } from '../parser/suggestions';

const MAX_VISIBLE_SUGGESTIONS = 6;

interface InputSuggestionPanelProps {
  visible: boolean;
  onClose: () => void
  suggestions: InputSuggestion[];
  selectedIndex: number;
}

export function InputSuggestionPanel({
  visible,
  suggestions,
  selectedIndex,
}: InputSuggestionPanelProps) {
  const { colors } = useTheme();
  const {
    selectedIndex: viewportSelectedIndex,
    visibleStart,
    visibleItems: visibleSuggestions,
    aboveCount,
    belowCount,
  } = getListViewport(suggestions, {
    selectedIndex,
    maxVisibleRows: MAX_VISIBLE_SUGGESTIONS,
  });

  if (!visible) return null;

  return (
    <box
      style={{
        position: 'absolute',
        left: 2,
        right: 2,
        bottom: 4,
        flexDirection: 'column',
        border: true,
        borderStyle: 'rounded',
        borderColor: colors.border.default,
        backgroundColor: colors.bg.panel,
        paddingLeft: 1,
        paddingRight: 1,
        paddingTop: 0,
        paddingBottom: 0.5,
        maxHeight: 8,
      }}
    >
      <scrollbox style={{ flexGrow: 1 }}>
        <box style={{ flexDirection: 'column' }}>
          {visibleSuggestions.map((suggestion, offset) => {
            const index = visibleStart + offset;
            const isSelected = index === viewportSelectedIndex;
            return (
              <text
                key={suggestion.id}
                fg={isSelected ? colors.accent.text : colors.text.primary}
                bg={isSelected ? colors.accent.primary : undefined}
              >
                {suggestion.label}
                {suggestion.detail ? ` - ${suggestion.detail}` : ''}
              </text>
            );
          })}
        </box>
      </scrollbox>
    </box>
  );
}
