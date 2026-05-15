import type { CliCommand } from '../commands/registry';
import { useTheme } from '../../../shared/theme/ThemeProvider';

interface CommandPaletteProps {
  visible: boolean;
  commands: CliCommand[];
  selectedIndex: number;
}

export function CommandPalette({ visible, commands, selectedIndex }: CommandPaletteProps) {
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
          {commands.map((cmd, index) => (
            <text
              key={cmd.name}
              fg={index === selectedIndex ? colors.accent.text : colors.text.primary}
              bg={index === selectedIndex ? colors.accent.primary : undefined}
            >
              /{cmd.name} - {cmd.description}
            </text>
          ))}
        </box>
      </scrollbox>
    </box>
  );
}
