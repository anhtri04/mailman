import { useState, useCallback } from 'react';

interface HeadersEditorProps {
  headers: Record<string, string>;
  onHeadersChange: (headers: Record<string, string>) => void;
}

interface HeaderEntry {
  key: string;
  value: string;
}

const HEADER_PRESETS: Record<string, string[]> = {
  'Content-Type': [
    'application/json',
    'application/x-www-form-urlencoded',
    'text/plain',
    'text/html',
    'application/xml',
    'multipart/form-data',
  ],
  Accept: ['application/json', 'text/plain', 'text/html', 'application/xml', '*/*'],
};

function parseHeaders(headers: Record<string, string>): HeaderEntry[] {
  return Object.entries(headers).map(([key, value]) => ({ key, value }));
}

function serializeHeaders(entries: HeaderEntry[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const entry of entries) {
    if (entry.key.trim()) {
      result[entry.key.trim()] = entry.value;
    }
  }
  return result;
}

export function HeadersEditor({ headers, onHeadersChange }: HeadersEditorProps) {
  const [entries, setEntries] = useState<HeaderEntry[]>(() => parseHeaders(headers));
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [focusedField, setFocusedField] = useState<'key' | 'value' | null>(null);
  const [showPresets, setShowPresets] = useState(false);

  const updateHeaders = useCallback(
    (newEntries: HeaderEntry[]) => {
      setEntries(newEntries);
      onHeadersChange(serializeHeaders(newEntries));
    },
    [onHeadersChange],
  );

  const handleAddHeader = useCallback(() => {
    if (newKey.trim()) {
      const newEntries = [...entries, { key: newKey.trim(), value: newValue }];
      updateHeaders(newEntries);
      setNewKey('');
      setNewValue('');
      setFocusedField('key');
    }
  }, [entries, newKey, newValue, updateHeaders]);

  const handleRemoveHeader = useCallback(
    (index: number) => {
      const newEntries = entries.filter((_, i) => i !== index);
      updateHeaders(newEntries);
    },
    [entries, updateHeaders],
  );

  const handleUpdateEntry = useCallback(
    (index: number, field: 'key' | 'value', value: string) => {
      const newEntries = entries.map((entry, i) => {
        if (i === index) {
          return { ...entry, [field]: value };
        }
        return entry;
      });
      updateHeaders(newEntries);
    },
    [entries, updateHeaders],
  );

  const handlePresetSelect = useCallback(
    (headerName: string, value: string) => {
      const existingIndex = entries.findIndex(
        (e) => e.key.toLowerCase() === headerName.toLowerCase(),
      );

      if (existingIndex >= 0) {
        const newEntries = entries.map((entry, i) => {
          if (i === existingIndex) {
            return { ...entry, value };
          }
          return entry;
        });
        updateHeaders(newEntries);
      } else {
        const newEntries = [...entries, { key: headerName, value }];
        updateHeaders(newEntries);
      }

      setShowPresets(false);
    },
    [entries, updateHeaders],
  );

  return (
    <box style={{ flexDirection: 'column', gap: 1 }}>
      <text fg="#CC8844">
        <strong>Headers</strong>
      </text>

      <box style={{ flexDirection: 'column', gap: 1 }}>
        {entries.map((entry, index) => (
          <box key={`${entry.key}-${index}`} style={{ flexDirection: 'row', gap: 1 }}>
            <box style={{ flexGrow: 1, border: true, borderColor: '#555555' }}>
              <input
                value={entry.key}
                onInput={(value) => handleUpdateEntry(index, 'key', value)}
                placeholder="Header name..."
                backgroundColor="#1a1a1a"
                textColor="#FFFFFF"
              />
            </box>
            <box style={{ flexGrow: 2, border: true, borderColor: '#555555' }}>
              <input
                value={entry.value}
                onInput={(value) => handleUpdateEntry(index, 'value', value)}
                placeholder="Header value..."
                backgroundColor="#1a1a1a"
                textColor="#FFFFFF"
              />
            </box>
            <box
              style={{
                paddingLeft: 1,
                paddingRight: 1,
                border: true,
                borderColor: '#555555',
              }}
              onMouseDown={() => handleRemoveHeader(index)}
            >
              <text fg="#FF6666">✕</text>
            </box>
          </box>
        ))}
      </box>

      <box style={{ flexDirection: 'column', gap: 1, marginTop: 1 }}>
        <box style={{ flexDirection: 'row', gap: 1 }}>
          <box
            style={{
              flexGrow: 1,
              border: true,
              borderColor: focusedField === 'key' ? '#CC8844' : '#555555',
            }}
          >
            <input
              value={newKey}
              onInput={setNewKey}
              placeholder="New header name..."
              focused={focusedField === 'key'}
              backgroundColor="#1a1a1a"
              textColor="#FFFFFF"
            />
          </box>
          <box
            style={{
              flexGrow: 2,
              border: true,
              borderColor: focusedField === 'value' ? '#CC8844' : '#555555',
            }}
          >
            <input
              value={newValue}
              onInput={setNewValue}
              placeholder="Header value..."
              focused={focusedField === 'value'}
              backgroundColor="#1a1a1a"
              textColor="#FFFFFF"
            />
          </box>
          <box
            style={{
              paddingLeft: 2,
              paddingRight: 2,
              border: true,
              borderColor: '#CC8844',
              backgroundColor: '#CC8844',
            }}
            onMouseDown={handleAddHeader}
          >
            <text fg="#000000">
              <strong>Add</strong>
            </text>
          </box>
        </box>

        <box
          style={{
            alignSelf: 'flex-start',
            paddingLeft: 2,
            paddingRight: 2,
            paddingTop: 1,
            paddingBottom: 1,
            border: true,
            borderColor: showPresets ? '#CC8844' : '#555555',
            backgroundColor: showPresets ? '#CC8844' : undefined,
          }}
          onMouseDown={() => setShowPresets(!showPresets)}
        >
          <text fg={showPresets ? '#000000' : '#999999'}>
            {showPresets ? <strong>Hide Presets</strong> : 'Common Headers'}
          </text>
        </box>

        {showPresets && (
          <box style={{ flexDirection: 'column', gap: 1, marginTop: 1 }}>
            <text fg="#999999">Click to add:</text>
            <box style={{ flexDirection: 'column', gap: 1 }}>
              {Object.entries(HEADER_PRESETS).map(([headerName, values]) => (
                <box key={headerName} style={{ flexDirection: 'column', gap: 1 }}>
                  <text fg="#CC8844">{headerName}:</text>
                  <box style={{ flexDirection: 'row', gap: 1, flexWrap: 'wrap' }}>
                    {values.map((value) => (
                      <box
                        key={value}
                        style={{
                          paddingLeft: 1,
                          paddingRight: 1,
                          paddingTop: 0,
                          paddingBottom: 0,
                          border: true,
                          borderColor: '#555555',
                        }}
                        onMouseDown={() => handlePresetSelect(headerName, value)}
                      >
                        <text fg="#FFFFFF">{value}</text>
                      </box>
                    ))}
                  </box>
                </box>
              ))}
            </box>
          </box>
        )}
      </box>

      {entries.length === 0 && (
        <text fg="#555555">
          <em>No headers set. Add headers above or use presets.</em>
        </text>
      )}
    </box>
  );
}
