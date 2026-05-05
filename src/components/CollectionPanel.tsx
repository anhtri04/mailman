import { colors } from '../theme/colors';

interface CollectionPanelProps {
  focused: boolean;
  onFocus: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function CollectionPanel({
  focused,
  onFocus,
  isCollapsed,
  onToggleCollapse,
}: CollectionPanelProps) {
  const borderColor = focused ? colors.accent.primary : colors.border.default;

  return (
    <box
      style={{
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        backgroundColor: colors.bg.app,
        borderColor,
        border: true,
        padding: isCollapsed ? 0 : 1,
        gap: 1,
        borderStyle: 'rounded',
      }}
      onMouseDown={onFocus}
    >
      <box style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: -2 }}>
        {!isCollapsed && (
          <text
            fg={colors.accent.primary}
            bg={colors.bg.app}
            style={{ paddingLeft: 1, paddingRight: 1 }}
          >
            <strong> Collections </strong>
          </text>
        )}

        <box
          style={{
            border: true,
            borderColor: colors.border.default,
            borderStyle: 'rounded',
            marginTop: 1,
            paddingLeft: 1,
            paddingRight: 1,
          }}
          onMouseDown={(e: { stopPropagation: () => void }) => {
            e.stopPropagation();
            onToggleCollapse();
          }}
        >
          <text fg={colors.accent.primary}>{isCollapsed ? '→' : '←'}</text>
        </box>
      </box>
    </box>
  );
}
