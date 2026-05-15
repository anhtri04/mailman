import type { CliCommand } from '../commands/registry';
import { useTheme } from '../../../shared/theme/ThemeProvider';

interface CommandPaletteProps {
  visible: boolean;
  commands: CliCommand[];
  input: string;
}

export function CommandPalette({ visible, commands, input }: CommandPaletteProps) {
  const { colors } = useTheme();
  if (!visible) return null;

  const query = input.slice(1).trim().toLowerCase();
  const filtered = commands
    .filter((cmd) => cmd.name.includes(query) || cmd.aliases.some((alias) => alias.includes(query)))
    .slice(0, 6);

  if (filtered.length === 0) return null;

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
      }}
    >
      {filtered.map((cmd) => (
        <text key={cmd.name} fg={colors.text.primary}>
          /{cmd.name} - {cmd.description}
        </text>
      ))}
    </box>
  );
}
