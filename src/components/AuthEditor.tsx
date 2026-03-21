import { useState, useCallback } from 'react';
import type { AuthConfig, AuthType } from '../types';

interface AuthEditorProps {
  auth?: AuthConfig;
  onAuthChange: (auth: AuthConfig) => void;
}

const AUTH_TYPES: { value: AuthType; label: string }[] = [
  { value: 'none', label: 'No Auth' },
  { value: 'bearer', label: 'Bearer Token' },
  { value: 'api-key', label: 'API Key' },
];

export function AuthEditor({ auth, onAuthChange }: AuthEditorProps) {
  const currentAuth = auth ?? { type: 'none' as AuthType };
  const [token, setToken] = useState(currentAuth.token ?? '');
  const [apiKey, setApiKey] = useState(currentAuth.key ?? '');
  const [apiValue, setApiValue] = useState(currentAuth.value ?? '');
  const [location, setLocation] = useState<'header' | 'query'>(currentAuth.location ?? 'header');

  const handleTypeChange = useCallback(
    (newType: AuthType) => {
      if (newType === 'none') {
        onAuthChange({ type: 'none' });
      } else if (newType === 'bearer') {
        onAuthChange({ type: 'bearer', token });
      } else if (newType === 'api-key') {
        onAuthChange({ type: 'api-key', key: apiKey, value: apiValue, location });
      }
    },
    [onAuthChange, token, apiKey, apiValue, location],
  );

  const handleTokenChange = useCallback(
    (newToken: string) => {
      setToken(newToken);
      if (currentAuth.type === 'bearer') {
        onAuthChange({ type: 'bearer', token: newToken });
      }
    },
    [currentAuth.type, onAuthChange],
  );

  const handleApiKeyChange = useCallback(
    (newKey: string) => {
      setApiKey(newKey);
      if (currentAuth.type === 'api-key') {
        onAuthChange({ type: 'api-key', key: newKey, value: apiValue, location });
      }
    },
    [currentAuth.type, onAuthChange, apiValue, location],
  );

  const handleApiValueChange = useCallback(
    (newValue: string) => {
      setApiValue(newValue);
      if (currentAuth.type === 'api-key') {
        onAuthChange({ type: 'api-key', key: apiKey, value: newValue, location });
      }
    },
    [currentAuth.type, onAuthChange, apiKey, location],
  );

  const handleLocationChange = useCallback(
    (newLocation: 'header' | 'query') => {
      setLocation(newLocation);
      if (currentAuth.type === 'api-key') {
        onAuthChange({ type: 'api-key', key: apiKey, value: apiValue, location: newLocation });
      }
    },
    [currentAuth.type, onAuthChange, apiKey, apiValue],
  );

  return (
    <box style={{ flexDirection: 'column', gap: 1, flexGrow: 1, height: '100%' }}>
      <text fg="#CC8844">
        <strong>Authentication</strong>
      </text>

      {/* Auth Type Selector */}
      <box style={{ flexDirection: 'column', gap: 1, marginTop: 1 }}>
        <text fg="#999999">Auth Type:</text>
        <box style={{ flexDirection: 'row', gap: 1 }}>
          {AUTH_TYPES.map((authType) => (
            <box
              key={authType.value}
              style={{
                paddingLeft: 2,
                paddingRight: 2,
                border: true,
                borderColor: currentAuth.type === authType.value ? '#CC8844' : '#555555',
                backgroundColor: currentAuth.type === authType.value ? '#CC8844' : undefined,
              }}
              onMouseDown={() => handleTypeChange(authType.value)}
            >
              <text fg={currentAuth.type === authType.value ? '#000000' : '#999999'}>
                {currentAuth.type === authType.value ? (
                  <strong>{authType.label}</strong>
                ) : (
                  authType.label
                )}
              </text>
            </box>
          ))}
        </box>
      </box>

      {/* Bearer Token Input */}
      {currentAuth.type === 'bearer' && (
        <box style={{ flexDirection: 'column', gap: 1, marginTop: 1 }}>
          <text fg="#999999">Bearer Token:</text>
          <box
            style={{
              border: true,
              borderColor: '#555555',
              paddingLeft: 1,
              paddingRight: 1,
            }}
          >
            <input
              value={token}
              onInput={handleTokenChange}
              placeholder="Enter bearer token..."
              backgroundColor="#1a1a1a"
              textColor="#FFFFFF"
            />
          </box>
          {token && (
            <text fg="#999999">
              <em>
                Will add: Authorization: Bearer {token.substring(0, 20)}
                {token.length > 20 ? '...' : ''}
              </em>
            </text>
          )}
        </box>
      )}

      {/* API Key Inputs */}
      {currentAuth.type === 'api-key' && (
        <box style={{ flexDirection: 'column', gap: 1, marginTop: 1 }}>
          <text fg="#999999">API Key Configuration:</text>

          {/* Location Selector */}
          <box style={{ flexDirection: 'row', gap: 1, marginTop: 1 }}>
            <text fg="#999999">Location:</text>
            <box
              style={{
                paddingLeft: 2,
                paddingRight: 2,
                border: true,
                borderColor: location === 'header' ? '#CC8844' : '#555555',
                backgroundColor: location === 'header' ? '#CC8844' : undefined,
              }}
              onMouseDown={() => handleLocationChange('header')}
            >
              <text fg={location === 'header' ? '#000000' : '#999999'}>
                {location === 'header' ? <strong>Header</strong> : 'Header'}
              </text>
            </box>
            <box
              style={{
                paddingLeft: 2,
                paddingRight: 2,
                border: true,
                borderColor: location === 'query' ? '#CC8844' : '#555555',
                backgroundColor: location === 'query' ? '#CC8844' : undefined,
              }}
              onMouseDown={() => handleLocationChange('query')}
            >
              <text fg={location === 'query' ? '#000000' : '#999999'}>
                {location === 'query' ? <strong>Query</strong> : 'Query'}
              </text>
            </box>
          </box>

          {/* Key Name Input */}
          <box style={{ flexDirection: 'column', gap: 1, marginTop: 1 }}>
            <text fg="#999999">Key Name:</text>
            <box
              style={{
                border: true,
                borderColor: '#555555',
                paddingLeft: 1,
                paddingRight: 1,
              }}
            >
              <input
                value={apiKey}
                onInput={handleApiKeyChange}
                placeholder="e.g., X-API-Key, api_key..."
                backgroundColor="#1a1a1a"
                textColor="#FFFFFF"
              />
            </box>
          </box>

          {/* Key Value Input */}
          <box style={{ flexDirection: 'column', gap: 1, marginTop: 1 }}>
            <text fg="#999999">Key Value:</text>
            <box
              style={{
                border: true,
                borderColor: '#555555',
                paddingLeft: 1,
                paddingRight: 1,
              }}
            >
              <input
                value={apiValue}
                onInput={handleApiValueChange}
                placeholder="Enter API key value..."
                backgroundColor="#1a1a1a"
                textColor="#FFFFFF"
              />
            </box>
          </box>

          {/* Preview */}
          {apiKey && apiValue && (
            <box style={{ marginTop: 1 }}>
              <text fg="#999999">
                <em>
                  Will add:{' '}
                  {location === 'header' ? `Header "${apiKey}"` : `Query param "${apiKey}"`} ={' '}
                  {apiValue.substring(0, 20)}
                  {apiValue.length > 20 ? '...' : ''}
                </em>
              </text>
            </box>
          )}
        </box>
      )}

      {currentAuth.type === 'none' && (
        <text fg="#555555" style={{ marginTop: 1 }}>
          <em>No authentication configured. Requests will be sent without auth headers.</em>
        </text>
      )}
    </box>
  );
}
