import { useTheme } from '../theme/ThemeProvider';

interface GraphQLResponsePanelProps {
  focused: boolean;
  onFocus: () => void;
}

export function GraphQLResponsePanel({ focused, onFocus }: GraphQLResponsePanelProps) {
  const { colors } = useTheme();

  return (
    <box
      style={{
        flexDirection: 'column',
        border: true,
        borderColor: focused ? colors.accent.primary : colors.border.default,
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
          <strong> GraphQL Response </strong>
        </text>
      </box>

      <box style={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}>
        <text fg={colors.text.muted}>GraphQL Response Panel (Coming Soon)</text>
      </box>
    </box>
  );
}
