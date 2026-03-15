import { useCallback, useMemo } from 'react';
import { useKeyboard } from '@opentui/react';

interface QueryParamsEditorProps {
  baseUrl: string;
  params: Record<string, string>;
  onParamsChange: (params: Record<string, string>) => void;
}

export function QueryParamsEditor({ baseUrl, params, onParamsChange }: QueryParamsEditorProps) {
  // Parse base URL to separate path from query params
  const { cleanUrl, existingParams } = useMemo(() => {
    const urlParts = baseUrl.split('?');
    const cleanUrl = urlParts[0] ?? '';
    const queryString = urlParts[1] ?? '';
    const existingParams: Record<string, string> = {};

    if (queryString) {
      const pairs = queryString.split('&');
      for (const pair of pairs) {
        const [key, value] = pair.split('=');
        if (key && value) {
          existingParams[decodeURIComponent(key)] = decodeURIComponent(value);
        }
      }
    }

    return { cleanUrl, existingParams };
  }, [baseUrl]);

  // Combine existing and new params
  const allParams = useMemo(() => {
    return { ...existingParams, ...params };
  }, [existingParams, params]);

  // Build full URL with encoded params
  const fullUrl = useMemo(() => {
    const paramsList = Object.entries(allParams).filter(([, value]) => value !== '');
    if (paramsList.length === 0) return cleanUrl;

    const encodedParams = paramsList
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');

    return `${cleanUrl}?${encodedParams}`;
  }, [cleanUrl, allParams]);

  // Convert params object to array for rendering
  const paramsArray = useMemo(() => {
    return Object.entries(params);
  }, [params]);

  const addParam = useCallback(() => {
    const newKey = `param${Date.now()}`;
    onParamsChange({ ...params, [newKey]: '' });
  }, [params, onParamsChange]);

  const removeParam = useCallback(
    (key: string) => {
      const newParams = { ...params };
      delete newParams[key];
      onParamsChange(newParams);
    },
    [params, onParamsChange],
  );

  const updateParamKey = useCallback(
    (oldKey: string, newKey: string) => {
      if (oldKey === newKey) return;
      const value = params[oldKey];
      if (value !== undefined) {
        const newParams = { ...params };
        delete newParams[oldKey];
        newParams[newKey] = value;
        onParamsChange(newParams);
      }
    },
    [params, onParamsChange],
  );

  const updateParamValue = useCallback(
    (key: string, newValue: string) => {
      onParamsChange({ ...params, [key]: newValue });
    },
    [params, onParamsChange],
  );

  return (
    <box
      style={{
        flexDirection: 'column',
        border: true,
        borderColor: '#555555',
        padding: 1,
      }}
    >
      <text fg="#CC8844">
        <strong>Query Parameters</strong>
      </text>

      {/* Params List */}
      <box style={{ flexDirection: 'column', gap: 1, marginTop: 1 }}>
        {paramsArray.length === 0 ? (
          <text fg="#999999">No query parameters added.</text>
        ) : (
          paramsArray.map(([key, value], index) => (
            <box key={`${key}-${index}`} style={{ flexDirection: 'row', gap: 1 }}>
              {/* Key Input */}
              <box
                style={{
                  flexGrow: 1,
                  border: true,
                  borderColor: '#555555',
                  paddingLeft: 1,
                  paddingRight: 1,
                }}
              >
                <input
                  value={key}
                  onInput={(newKey) => updateParamKey(key, newKey)}
                  placeholder="Key"
                />
              </box>

              <text fg="#999999">=</text>

              {/* Value Input */}
              <box
                style={{
                  flexGrow: 2,
                  border: true,
                  borderColor: '#555555',
                  paddingLeft: 1,
                  paddingRight: 1,
                }}
              >
                <input
                  value={value}
                  onInput={(newValue) => updateParamValue(key, newValue)}
                  placeholder="Value"
                />
              </box>

              {/* Remove Button */}
              <box
                style={{
                  border: true,
                  borderColor: '#AA5555',
                  paddingLeft: 1,
                  paddingRight: 1,
                }}
                onMouseDown={() => removeParam(key)}
              >
                <text fg="#AA5555">-</text>
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
          borderColor: '#99AA77',
          paddingLeft: 2,
          paddingRight: 2,
          alignSelf: 'flex-start',
        }}
        onMouseDown={addParam}
      >
        <text fg="#99AA77">+ Add Parameter</text>
      </box>

      {/* Full URL Display */}
      <box style={{ marginTop: 1, flexDirection: 'column' }}>
        <text fg="#999999">Full URL:</text>
        <box
          style={{
            border: true,
            borderColor: '#333333',
            padding: 1,
            marginTop: 1,
          }}
        >
          <text fg="#CCCCCC">{fullUrl}</text>
        </box>
      </box>
    </box>
  );
}
