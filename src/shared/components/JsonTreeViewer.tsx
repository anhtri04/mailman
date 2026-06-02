import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { useTheme } from '../theme/ThemeProvider';
import { buildJsonTreeRows, parseJsonTree } from '../utils/json-tree';
import type { JsonTreeRow, JsonValueKind } from '../utils/json-tree';

interface JsonTreeViewerProps {
  body: string;
  collapsedPaths: ReadonlySet<string>;
  onTogglePath: (path: string) => void;
  fallback?: ReactNode;
}

export function JsonTreeViewer({
  body,
  collapsedPaths,
  onTogglePath,
  fallback,
}: JsonTreeViewerProps) {
  const { colors } = useTheme();

  const parsed = useMemo(() => parseJsonTree(body), [body]);
  const rows = useMemo(() => {
    if (!parsed.ok) return [];
    return buildJsonTreeRows(parsed.value, collapsedPaths);
  }, [parsed, collapsedPaths]);

  if (!parsed.ok) {
    return fallback ?? <text fg={colors.text.muted}>Unable to parse response as JSON.</text>;
  }

  const getValueColor = (kind: JsonValueKind): string => {
    switch (kind) {
      case 'string':
        return colors.syntax.success;
      case 'number':
        return colors.syntax.warning;
      case 'boolean':
      case 'null':
        return colors.text.muted;
      case 'object':
      case 'array':
        return colors.text.primary;
    }
  };

  const renderRow = (row: JsonTreeRow) => {
    const isToggleable = row.expandable && row.rowType === 'container';
    const indicator = isToggleable ? (row.collapsed ? '▸ ' : '▾ ') : '  ';
    const keyColor = colors.syntax.warning;
    const punctuationColor = colors.text.primary;
    const valueColor = getValueColor(row.kind);

    return (
      <box
        key={row.id}
        style={{ flexDirection: 'row' }}
        onMouseDown={isToggleable ? () => onTogglePath(row.path) : undefined}
      >
        <text fg={colors.text.dim}>{'  '.repeat(row.depth)}</text>
        <text fg={isToggleable ? colors.accent.primary : colors.text.dim}>{indicator}</text>
        {row.keyLabel && (
          <>
            <text fg={keyColor}>{row.keyLabel}</text>
            <text fg={punctuationColor}>: </text>
          </>
        )}
        {row.rowType === 'close' ? (
          <text fg={punctuationColor}>
            {row.valueText}
            {row.trailingComma ? ',' : ''}
          </text>
        ) : row.kind === 'object' || row.kind === 'array' ? (
          <text fg={punctuationColor}>
            {row.valueText}
            {row.trailingComma ? ',' : ''}
          </text>
        ) : (
          <text fg={valueColor}>
            {row.valueText}
            {row.trailingComma ? ',' : ''}
          </text>
        )}
      </box>
    );
  };

  return <box style={{ flexDirection: 'column' }}>{rows.map((row) => renderRow(row))}</box>;
}
