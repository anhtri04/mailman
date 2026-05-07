import { useTheme } from '../theme/ThemeProvider';

interface GraphQLRequestPanelProps {
  focused: boolean;
  onFocus: () => void;
}

export function GraphQLRequestPanel({ focused, onFocus }: GraphQLRequestPanelProps) {
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
          <strong> GraphQL Request </strong>
        </text>
      </box>

      <box style={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}>
        <text fg={colors.text.muted}>GraphQL Request Panel (Coming Soon)</text>
      </box>
    </box>
  );
}
