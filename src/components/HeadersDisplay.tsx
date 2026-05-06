// Headers display component for showing HTTP response headers
import { useMemo } from 'react';
import { useTheme } from '../theme/ThemeProvider';

interface HeadersDisplayProps {
  headers: Record<string, string>;
}

export function HeadersDisplay({ headers }: HeadersDisplayProps) {
  const { colors } = useTheme();
  const sortedHeaders = useMemo(() => {
    return Object.entries(headers).sort(([keyA], [keyB]) =>
      keyA.toLowerCase().localeCompare(keyB.toLowerCase()),
    );
  }, [headers]);

  if (sortedHeaders.length === 0) {
    return (
      <box style={{ flexDirection: 'column', padding: 1 }}>
        <text fg={colors.text.muted}>No headers available</text>
      </box>
    );
  }

  return (
    <box style={{ flexDirection: 'column' }}>
      {sortedHeaders.map(([key, value], index) => (
        <box
          key={key}
          style={{
            flexDirection: 'row',
            paddingLeft: 1,
            paddingRight: 1,
            paddingTop: 0,
            paddingBottom: 0,
          }}
        >
          <text fg={colors.accent.primary} style={{ width: 30 }}>
            {key}:
          </text>
          <text fg={colors.syntax.success}>{value}</text>
        </box>
      ))}
    </box>
  );
}
