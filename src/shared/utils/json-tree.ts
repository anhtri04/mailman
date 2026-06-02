export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type JsonValueKind = 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';

export interface ParsedJsonTree {
  ok: true;
  value: JsonValue;
}

export interface JsonTreeParseError {
  ok: false;
  error: string;
}

export type JsonTreeParseResult = ParsedJsonTree | JsonTreeParseError;

export interface JsonTreeRow {
  id: string;
  path: string;
  depth: number;
  kind: JsonValueKind;
  rowType: 'container' | 'primitive' | 'close';
  keyLabel?: string;
  valueText?: string;
  opener?: '{' | '[';
  closer?: '}' | ']';
  expandable: boolean;
  collapsed: boolean;
  childCount: number;
  trailingComma: boolean;
}

export function parseJsonTree(body: string): JsonTreeParseResult {
  try {
    return { ok: true, value: JSON.parse(body) as JsonValue };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export function buildJsonTreeRows(
  value: JsonValue,
  collapsedPaths: ReadonlySet<string>,
): JsonTreeRow[] {
  const rows: JsonTreeRow[] = [];
  appendJsonTreeRows(rows, value, '$', 0, false);
  return rows;

  function appendJsonTreeRows(
    target: JsonTreeRow[],
    current: JsonValue,
    path: string,
    depth: number,
    trailingComma: boolean,
    keyLabel?: string,
  ): void {
    const kind = getJsonValueKind(current);

    if (kind !== 'object' && kind !== 'array') {
      target.push({
        id: path,
        path,
        depth,
        kind,
        rowType: 'primitive',
        keyLabel,
        valueText: formatJsonPrimitive(current as JsonPrimitive),
        expandable: false,
        collapsed: false,
        childCount: 0,
        trailingComma,
      });
      return;
    }

    const isArray = Array.isArray(current);
    const entries = isArray
      ? current.map((item, index) => [String(index), item] as const)
      : Object.entries(current as { [key: string]: JsonValue });
    const childCount = entries.length;
    const opener = isArray ? '[' : '{';
    const closer = isArray ? ']' : '}';
    const expandable = childCount > 0;
    const collapsed = expandable && collapsedPaths.has(path);

    if (!expandable || collapsed) {
      target.push({
        id: path,
        path,
        depth,
        kind,
        rowType: 'container',
        keyLabel,
        valueText: collapsed ? getCollapsedSummary(kind, childCount) : `${opener}${closer}`,
        opener,
        closer,
        expandable,
        collapsed,
        childCount,
        trailingComma,
      });
      return;
    }

    target.push({
      id: `${path}:open`,
      path,
      depth,
      kind,
      rowType: 'container',
      keyLabel,
      valueText: opener,
      opener,
      closer,
      expandable,
      collapsed: false,
      childCount,
      trailingComma: false,
    });

    entries.forEach(([entryKey, entryValue], index) => {
      appendJsonTreeRows(
        target,
        entryValue,
        appendJsonPath(path, entryKey),
        depth + 1,
        index < entries.length - 1,
        isArray ? entryKey : JSON.stringify(entryKey),
      );
    });

    target.push({
      id: `${path}:close`,
      path,
      depth,
      kind,
      rowType: 'close',
      valueText: closer,
      closer,
      expandable: false,
      collapsed: false,
      childCount,
      trailingComma,
    });
  }
}

export function appendJsonPath(parentPath: string, segment: string): string {
  return `${parentPath}/${segment.replaceAll('~', '~0').replaceAll('/', '~1')}`;
}

export function getJsonValueKind(value: JsonValue): JsonValueKind {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  return 'boolean';
}

export function formatJsonPrimitive(value: JsonPrimitive): string {
  if (typeof value === 'string') return JSON.stringify(value);
  return String(value);
}

export function canRenderJsonTree(body: string): boolean {
  const parsed = parseJsonTree(body);
  return parsed.ok && ['object', 'array'].includes(getJsonValueKind(parsed.value));
}

function getCollapsedSummary(kind: JsonValueKind, childCount: number): string {
  const unit =
    kind === 'array' ? (childCount === 1 ? 'item' : 'items') : childCount === 1 ? 'key' : 'keys';
  return kind === 'array' ? `[…] ${childCount} ${unit}` : `{…} ${childCount} ${unit}`;
}
