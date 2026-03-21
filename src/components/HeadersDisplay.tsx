// Headers display component for showing HTTP response headers
import { useMemo } from 'react';

interface HeadersDisplayProps {
  headers: Record<string, string>;
}

export function HeadersDisplay({ headers }: HeadersDisplayProps) {
  const sortedHeaders = useMemo(() => {
    return Object.entries(headers).sort(([keyA], [keyB]) =>
      keyA.toLowerCase().localeCompare(keyB.toLowerCase()),
    );
  }, [headers]);

  if (sortedHeaders.length === 0) {
    return (
      <box style={{ flexDirection: 'column', padding: 1 }}>
        <text fg="#999999">No headers available</text>
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
          <text fg="#CC8844" style={{ width: 30 }}>
            {key}:
          </text>
          <text fg="#99AA77">{value}</text>
        </box>
      ))}
    </box>
  );
}
