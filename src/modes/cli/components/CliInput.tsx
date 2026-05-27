import { useTheme } from '../../../shared/theme/ThemeProvider';

interface CliInputProps {
  value: string;
  prompt: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  focused?: boolean;
}

export function CliInput({ value, prompt, onChange, onFocus, focused = true }: CliInputProps) {
  const { colors } = useTheme();

  return (
    <box
      style={{
        flexDirection: 'row',
        flexShrink: 0,
        height: 3,
        border: true,
        borderStyle: 'rounded',
        borderColor: colors.accent.primary,
        paddingLeft: 1,
        paddingRight: 1,
      }}
      onMouseDown={onFocus}
    >
      <text fg={colors.accent.primary}>{prompt}&gt; </text>
      <box style={{ flexGrow: 1 }}>
        <input
          value={value}
          onInput={onChange}
          focused={focused}
          placeholder="Enter /command, shell command, or request"
        />
      </box>
    </box>
  );
}
