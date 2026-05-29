import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from '../theme/ThemeProvider';

interface QueryParamsEditorProps {
  baseUrl: string;
  params: Record<string, string>;
  onParamsChange: (params: Record<string, string>) => void;
}

interface QueryParamEntry {
  id: string;
  key: string;
  value: string;
}

function parseParams(params: Record<string, string>): QueryParamEntry[] {
  return Object.entries(params).map(([key, value], index) => ({
    id: `param-${index}-${key}`,
    key,
    value,
  }));
}

function serializeParams(entries: QueryParamEntry[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const entry of entries) {
    const key = entry.key.trim();
    if (key && entry.value !== '') {
      result[key] = entry.value;
    }
  }
  return result;
}

function getParamsSignature(params: Record<string, string>): string {
  return JSON.stringify(Object.entries(params).sort(([a], [b]) => a.localeCompare(b)));
}

export function QueryParamsEditor({ baseUrl, params, onParamsChange }: QueryParamsEditorProps) {
  const { colors } = useTheme();
  const [entries, setEntries] = useState<QueryParamEntry[]>(() => parseParams(params));
  const lastEmittedSignature = useRef(getParamsSignature(params));

  const cleanUrl = useMemo(() => baseUrl.split('?')[0] ?? '', [baseUrl]);
  const paramsSignature = useMemo(() => getParamsSignature(params), [params]);

  useEffect(() => {
    if (paramsSignature === lastEmittedSignature.current) return;
    setEntries(parseParams(params));
    lastEmittedSignature.current = paramsSignature;
  }, [params, paramsSignature]);

  const updateEntries = useCallback(
    (newEntries: QueryParamEntry[]) => {
      setEntries(newEntries);
      const serializedParams = serializeParams(newEntries);
      lastEmittedSignature.current = getParamsSignature(serializedParams);
      onParamsChange(serializedParams);
    },
    [onParamsChange],
  );

  // Build full URL with encoded, non-empty params
  const fullUrl = useMemo(() => {
    const paramsList = Object.entries(serializeParams(entries));
    if (paramsList.length === 0) return cleanUrl;

    const encodedParams = paramsList
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');

    return `${cleanUrl}?${encodedParams}`;
  }, [cleanUrl, entries]);

  const addParam = useCallback(() => {
    updateEntries([...entries, { id: `param-${Date.now()}`, key: '', value: '' }]);
  }, [entries, updateEntries]);

  const removeParam = useCallback(
    (id: string) => {
      updateEntries(entries.filter((entry) => entry.id !== id));
    },
    [entries, updateEntries],
  );

  const updateParamKey = useCallback(
    (id: string, newKey: string) => {
      updateEntries(entries.map((entry) => (entry.id === id ? { ...entry, key: newKey } : entry)));
    },
    [entries, updateEntries],
  );

  const updateParamValue = useCallback(
    (id: string, newValue: string) => {
      updateEntries(
        entries.map((entry) => (entry.id === id ? { ...entry, value: newValue } : entry)),
      );
    },
    [entries, updateEntries],
  );

  return (
    <box
      style={{
        flexDirection: 'column',
        // border: false,
        // borderColor: colors.border.default,
        padding: 1,
        flexGrow: 1,
        height: '100%',
      }}
    >
      {/* Params List */}
      <box style={{ flexDirection: 'column', gap: 1, marginTop: 1 }}>
        {entries.length === 0 ? (
          <text fg={colors.text.muted}>No query parameters added.</text>
        ) : (
          entries.map((entry) => (
            <box key={entry.id} style={{ flexDirection: 'row', gap: 1 }}>
              {/* Key Input */}
              <box
                style={{
                  flexGrow: 1,
                  border: true,
                  borderColor: colors.border.default,
                  paddingLeft: 1,
                  paddingRight: 1,
                  paddingTop: 0.5,
                  paddingBottom: 0.5,
                }}
              >
                <input
                  value={entry.key}
                  onInput={(newKey) => updateParamKey(entry.id, newKey)}
                  placeholder="Key"
                />
              </box>

              <text fg={colors.text.muted}>=</text>

              {/* Value Input */}
              <box
                style={{
                  flexGrow: 2,
                  border: true,
                  borderColor: colors.border.default,
                  paddingLeft: 1,
                  paddingRight: 1,
                  paddingTop: 0.5,
                  paddingBottom: 0.5,
                }}
              >
                <input
                  value={entry.value}
                  onInput={(newValue) => updateParamValue(entry.id, newValue)}
                  placeholder="Value"
                />
              </box>

              {/* Remove Button */}
              <box
                style={{
                  border: true,
                  borderColor: colors.syntax.error,
                  paddingLeft: 1,
                  paddingRight: 1,
                  paddingTop: 0.5,
                  paddingBottom: 0.5,
                }}
                onMouseDown={() => removeParam(entry.id)}
              >
                <text fg={colors.syntax.error}>-</text>
              </box>
            </box>
          ))
        )}
      </box>

      {/* Add Button */}
      <box
        style={{
          marginTop: 1,
          border: true,
          borderColor: colors.syntax.success,
          paddingLeft: 2,
          paddingRight: 2,
          paddingTop: 0.5,
          paddingBottom: 0.5,
          alignSelf: 'flex-start',
        }}
        onMouseDown={addParam}
      >
        <text fg={colors.syntax.success}>+ Add Parameter</text>
      </box>

      {/* Full URL Display */}
      <box style={{ marginTop: 1, flexDirection: 'column' }}>
        <text fg={colors.text.muted}>Full URL:</text>
        <box
          style={{
            border: true,
            borderColor: colors.bg.selection,
            padding: 1,
            marginTop: 1,
            marginBottom: 1,
          }}
        >
          <text fg={colors.text.primary}>{fullUrl}</text>
        </box>
      </box>
    </box>
  );
}
