import { useTheme } from '../../../shared/theme/ThemeProvider';

interface CliInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function CliInput({ value, onChange }: CliInputProps) {
  const { colors } = useTheme();

  return (
    <box
      style={{
        flexDirection: 'row',
        border: true,
        borderStyle: 'rounded',
        borderColor: colors.accent.primary,
        paddingLeft: 1,
        paddingRight: 1,
        paddingTop: 0.5,
        paddingBottom: 0.5,
        alignItems: 'center',
      }}
    >
      <text fg={colors.accent.primary}>mailman&gt; </text>
      <box style={{ flexGrow: 1 }}>
        <input
          value={value}
          onInput={onChange}
          focused={true}
          placeholder="Enter /command or request"
        />
      </box>
    </box>
  );
}
