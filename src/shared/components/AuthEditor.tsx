import { useState, useCallback } from 'react';
import { useTheme } from '../theme/ThemeProvider';
import type { AuthConfig, AuthType } from '../../types';
import type { KeyBinding } from '@opentui/core';

interface AuthEditorProps {
  auth?: AuthConfig;
  onAuthChange: (auth: AuthConfig) => void;
}

const AUTH_TYPES: { value: AuthType; label: string }[] = [
  { value: 'none', label: 'No Auth' },
  { value: 'bearer', label: 'Bearer Token' },
  { value: 'api-key', label: 'API Key' },
  { value: 'basic', label: 'Basic Auth' },
  { value: 'oauth2', label: 'OAuth 2.0' },
];

export function AuthEditor({ auth, onAuthChange }: AuthEditorProps) {
  const { colors } = useTheme();
  const currentAuth = auth ?? { type: 'none' as AuthType };
  const [token, setToken] = useState(currentAuth.token ?? '');
  const [apiKey, setApiKey] = useState(currentAuth.key ?? '');
  const [apiValue, setApiValue] = useState(currentAuth.value ?? '');
  const [location, setLocation] = useState<'header' | 'query'>(currentAuth.location ?? 'header');
  const [username, setUsername] = useState(currentAuth.username ?? '');
  const [password, setPassword] = useState(currentAuth.password ?? '');
  const [oauth2GrantType, setOauth2GrantType] = useState<
    'client_credentials' | 'authorization_code'
  >(currentAuth.oauth2?.grantType ?? 'client_credentials');
  const [oauth2TokenUrl, setOauth2TokenUrl] = useState(currentAuth.oauth2?.tokenUrl ?? '');
  const [oauth2ClientId, setOauth2ClientId] = useState(currentAuth.oauth2?.clientId ?? '');
  const [oauth2ClientSecret, setOauth2ClientSecret] = useState(
    currentAuth.oauth2?.clientSecret ?? '',
  );
  const [oauth2Scope, setOauth2Scope] = useState(currentAuth.oauth2?.scope ?? '');
  const [oauth2Code, setOauth2Code] = useState(currentAuth.oauth2?.code ?? '');
  const [oauth2RedirectUri, setOauth2RedirectUri] = useState(currentAuth.oauth2?.redirectUri ?? '');
  const [oauth2CodeVerifier, setOauth2CodeVerifier] = useState(
    currentAuth.oauth2?.codeVerifier ?? '',
  );
  const [oauth2AccessToken, setOauth2AccessToken] = useState(currentAuth.oauth2?.accessToken ?? '');
  const [oauth2RefreshToken, setOauth2RefreshToken] = useState(
    currentAuth.oauth2?.refreshToken ?? '',
  );
  const selectAllBindings: KeyBinding[] = [{ name: 'a', ctrl: true, action: 'select-all' }];

  const buildOAuth2AuthConfig = useCallback((): AuthConfig => {
    const oauth2 = {
      grantType: oauth2GrantType,
      tokenUrl: oauth2TokenUrl,
      clientId: oauth2ClientId,
      clientSecret: oauth2ClientSecret || undefined,
      scope: oauth2Scope || undefined,
      code: oauth2Code || undefined,
      redirectUri: oauth2RedirectUri || undefined,
      codeVerifier: oauth2CodeVerifier || undefined,
      accessToken: oauth2AccessToken || undefined,
      refreshToken: oauth2RefreshToken || undefined,
      tokenType: currentAuth.oauth2?.tokenType,
      expiresAt: currentAuth.oauth2?.expiresAt,
    } as const;

    return {
      type: 'oauth2',
      oauth2,
    };
  }, [
    oauth2GrantType,
    oauth2TokenUrl,
    oauth2ClientId,
    oauth2ClientSecret,
    oauth2Scope,
    oauth2Code,
    oauth2RedirectUri,
    oauth2CodeVerifier,
    oauth2AccessToken,
    oauth2RefreshToken,
    currentAuth.oauth2?.tokenType,
    currentAuth.oauth2?.expiresAt,
  ]);

  const handleTypeChange = useCallback(
    (newType: AuthType) => {
      if (newType === 'none') {
        onAuthChange({ type: 'none' });
      } else if (newType === 'bearer') {
        onAuthChange({ type: 'bearer', token });
      } else if (newType === 'api-key') {
        onAuthChange({ type: 'api-key', key: apiKey, value: apiValue, location });
      } else if (newType === 'basic') {
        onAuthChange({ type: 'basic', username, password });
      } else if (newType === 'oauth2') {
        onAuthChange(buildOAuth2AuthConfig());
      }
    },
    [onAuthChange, token, apiKey, apiValue, location, username, password, buildOAuth2AuthConfig],
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

  const handleBasicUsernameChange = useCallback(
    (newUsername: string) => {
      setUsername(newUsername);
      if (currentAuth.type === 'basic') {
        onAuthChange({ type: 'basic', username: newUsername, password });
      }
    },
    [currentAuth.type, onAuthChange, password],
  );

  const handleBasicPasswordChange = useCallback(
    (newPassword: string) => {
      setPassword(newPassword);
      if (currentAuth.type === 'basic') {
        onAuthChange({ type: 'basic', username, password: newPassword });
      }
    },
    [currentAuth.type, onAuthChange, username],
  );

  const updateOAuth2 = useCallback(() => {
    if (currentAuth.type === 'oauth2') {
      onAuthChange(buildOAuth2AuthConfig());
    }
  }, [currentAuth.type, onAuthChange, buildOAuth2AuthConfig]);

  return (
    <box style={{ flexDirection: 'column', gap: 1, flexGrow: 1, height: '100%' }}>
      <scrollbox style={{ flexGrow: 1 }}>
        {/* Auth Type Selector */}
        <box style={{ flexDirection: 'column', gap: 1, marginTop: 1 }}>
          <text fg={colors.text.muted}>Auth Type:</text>
          <box style={{ flexDirection: 'row', gap: 1 }}>
            {AUTH_TYPES.map((authType) => (
              <box
                key={authType.value}
                style={{
                  paddingLeft: 2,
                  paddingRight: 2,
                  paddingTop: 0.5,
                  border: true,
                  borderColor:
                    currentAuth.type === authType.value
                      ? colors.accent.primary
                      : colors.border.default,
                }}
                onMouseDown={() => handleTypeChange(authType.value)}
              >
                <text
                  fg={
                    currentAuth.type === authType.value ? colors.accent.primary : colors.text.muted
                  }
                >
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
            <text fg={colors.text.muted}>Bearer Token:</text>
            <box
              style={{
                border: true,
                borderColor: colors.border.default,
                paddingLeft: 1,
                paddingRight: 1,
              }}
            >
              <input
                value={token}
                onInput={handleTokenChange}
                placeholder="Enter bearer token..."
                backgroundColor={colors.bg.panel}
                textColor={colors.text.primary}
                keyBindings={selectAllBindings}
              />
            </box>
            {token && (
              <text fg={colors.text.muted}>
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
            <text fg={colors.text.muted}>API Key Configuration:</text>

            {/* Location Selector */}
            <box style={{ flexDirection: 'row', gap: 1, marginTop: 1 }}>
              <text fg={colors.text.muted}>Location:</text>
              <box
                style={{
                  paddingLeft: 2,
                  paddingRight: 2,
                  paddingTop: 0.5,
                  paddingBottom: 0.5,
                  border: true,
                  borderColor:
                    location === 'header' ? colors.accent.primary : colors.border.default,
                }}
                onMouseDown={() => handleLocationChange('header')}
              >
                <text fg={location === 'header' ? colors.accent.primary : colors.text.muted}>
                  {location === 'header' ? <strong>Header</strong> : 'Header'}
                </text>
              </box>
              <box
                style={{
                  paddingLeft: 2,
                  paddingRight: 2,
                  paddingTop: 0.5,
                  paddingBottom: 0.5,
                  border: true,
                  borderColor: location === 'query' ? colors.accent.primary : colors.border.default,
                }}
                onMouseDown={() => handleLocationChange('query')}
              >
                <text fg={location === 'query' ? colors.accent.primary : colors.text.muted}>
                  {location === 'query' ? <strong>Query</strong> : 'Query'}
                </text>
              </box>
            </box>

            {/* Key Name Input */}
            <box style={{ flexDirection: 'column', gap: 1, marginTop: 1 }}>
              <text fg={colors.text.muted}>Key Name:</text>
              <box
                style={{
                  border: true,
                  borderColor: colors.border.default,
                  paddingLeft: 1,
                  paddingRight: 1,
                  paddingTop: 0.5,
                  paddingBottom: 0.5,
                }}
              >
                <input
                  value={apiKey}
                  onInput={handleApiKeyChange}
                  placeholder="e.g., X-API-Key, api_key..."
                  backgroundColor={colors.bg.panel}
                  textColor={colors.text.primary}
                  keyBindings={selectAllBindings}
                />
              </box>
            </box>

            {/* Key Value Input */}
            <box style={{ flexDirection: 'column', gap: 1, marginTop: 1 }}>
              <text fg={colors.text.muted}>Key Value:</text>
              <box
                style={{
                  border: true,
                  borderColor: colors.border.default,
                  paddingLeft: 1,
                  paddingRight: 1,
                  paddingTop: 0.5,
                  paddingBottom: 0.5,
                }}
              >
                <input
                  value={apiValue}
                  onInput={handleApiValueChange}
                  placeholder="Enter API key value..."
                  backgroundColor={colors.bg.panel}
                  textColor={colors.text.primary}
                  keyBindings={selectAllBindings}
                />
              </box>
            </box>

            {/* Preview */}
            {apiKey && apiValue && (
              <box style={{ marginTop: 1 }}>
                <text fg={colors.text.muted}>
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

        {currentAuth.type === 'basic' && (
          <box style={{ flexDirection: 'column', gap: 1, marginTop: 1 }}>
            <text fg={colors.text.muted}>Username:</text>
            <box style={{ border: true, borderColor: colors.border.default, paddingLeft: 1 }}>
              <input
                value={username}
                onInput={handleBasicUsernameChange}
                placeholder="Enter username..."
                backgroundColor={colors.bg.panel}
                textColor={colors.text.primary}
                keyBindings={selectAllBindings}
              />
            </box>
            <text fg={colors.text.muted}>Password:</text>
            <box style={{ border: true, borderColor: colors.border.default, paddingLeft: 1 }}>
              <input
                value={password}
                onInput={handleBasicPasswordChange}
                placeholder="Enter password..."
                backgroundColor={colors.bg.panel}
                textColor={colors.text.primary}
                keyBindings={selectAllBindings}
              />
            </box>
          </box>
        )}

        {currentAuth.type === 'oauth2' && (
          <box style={{ flexDirection: 'column', gap: 1, marginTop: 1 }}>
            <text fg={colors.text.muted}>OAuth 2.0 Configuration:</text>
            <box style={{ flexDirection: 'row', gap: 1 }}>
              <box
                style={{
                  paddingLeft: 2,
                  paddingRight: 2,
                  border: true,
                  borderColor:
                    oauth2GrantType === 'client_credentials'
                      ? colors.accent.primary
                      : colors.border.default,
                }}
                onMouseDown={() => {
                  setOauth2GrantType('client_credentials');
                  updateOAuth2();
                }}
              >
                <text
                  fg={
                    oauth2GrantType === 'client_credentials'
                      ? colors.accent.primary
                      : colors.text.muted
                  }
                >
                  Client Credentials
                </text>
              </box>
              <box
                style={{
                  paddingLeft: 2,
                  paddingRight: 2,
                  border: true,
                  borderColor:
                    oauth2GrantType === 'authorization_code'
                      ? colors.accent.primary
                      : colors.border.default,
                }}
                onMouseDown={() => {
                  setOauth2GrantType('authorization_code');
                  updateOAuth2();
                }}
              >
                <text
                  fg={
                    oauth2GrantType === 'authorization_code'
                      ? colors.accent.primary
                      : colors.text.muted
                  }
                >
                  Authorization Code
                </text>
              </box>
            </box>

            <text fg={colors.text.muted}>Token URL:</text>
            <box style={{ border: true, borderColor: colors.border.default, paddingLeft: 1 }}>
              <input
                value={oauth2TokenUrl}
                onInput={(val) => {
                  setOauth2TokenUrl(val);
                  updateOAuth2();
                }}
                placeholder="https://auth.example.com/oauth/token"
                backgroundColor={colors.bg.panel}
                textColor={colors.text.primary}
                keyBindings={selectAllBindings}
              />
            </box>

            <text fg={colors.text.muted}>Client ID:</text>
            <box style={{ border: true, borderColor: colors.border.default, paddingLeft: 1 }}>
              <input
                value={oauth2ClientId}
                onInput={(val) => {
                  setOauth2ClientId(val);
                  updateOAuth2();
                }}
                placeholder="Enter client id..."
                backgroundColor={colors.bg.panel}
                textColor={colors.text.primary}
                keyBindings={selectAllBindings}
              />
            </box>

            <text fg={colors.text.muted}>Client Secret (optional for PKCE/public clients):</text>
            <box style={{ border: true, borderColor: colors.border.default, paddingLeft: 1 }}>
              <input
                value={oauth2ClientSecret}
                onInput={(val) => {
                  setOauth2ClientSecret(val);
                  updateOAuth2();
                }}
                placeholder="Enter client secret..."
                backgroundColor={colors.bg.panel}
                textColor={colors.text.primary}
                keyBindings={selectAllBindings}
              />
            </box>

            <text fg={colors.text.muted}>Scope (optional):</text>
            <box style={{ border: true, borderColor: colors.border.default, paddingLeft: 1 }}>
              <input
                value={oauth2Scope}
                onInput={(val) => {
                  setOauth2Scope(val);
                  updateOAuth2();
                }}
                placeholder="read write profile"
                backgroundColor={colors.bg.panel}
                textColor={colors.text.primary}
                keyBindings={selectAllBindings}
              />
            </box>

            {oauth2GrantType === 'authorization_code' && (
              <>
                <text fg={colors.text.muted}>Authorization Code:</text>
                <box style={{ border: true, borderColor: colors.border.default, paddingLeft: 1 }}>
                  <input
                    value={oauth2Code}
                    onInput={(val) => {
                      setOauth2Code(val);
                      updateOAuth2();
                    }}
                    placeholder="Paste authorization code..."
                    backgroundColor={colors.bg.panel}
                    textColor={colors.text.primary}
                    keyBindings={selectAllBindings}
                  />
                </box>

                <text fg={colors.text.muted}>Redirect URI (optional):</text>
                <box style={{ border: true, borderColor: colors.border.default, paddingLeft: 1 }}>
                  <input
                    value={oauth2RedirectUri}
                    onInput={(val) => {
                      setOauth2RedirectUri(val);
                      updateOAuth2();
                    }}
                    placeholder="https://localhost/callback"
                    backgroundColor={colors.bg.panel}
                    textColor={colors.text.primary}
                    keyBindings={selectAllBindings}
                  />
                </box>

                <text fg={colors.text.muted}>Code Verifier (optional PKCE):</text>
                <box style={{ border: true, borderColor: colors.border.default, paddingLeft: 1 }}>
                  <input
                    value={oauth2CodeVerifier}
                    onInput={(val) => {
                      setOauth2CodeVerifier(val);
                      updateOAuth2();
                    }}
                    placeholder="Enter code verifier..."
                    backgroundColor={colors.bg.panel}
                    textColor={colors.text.primary}
                    keyBindings={selectAllBindings}
                  />
                </box>
              </>
            )}

            <text fg={colors.text.muted}>Access Token (optional seed):</text>
            <box style={{ border: true, borderColor: colors.border.default, paddingLeft: 1 }}>
              <input
                value={oauth2AccessToken}
                onInput={(val) => {
                  setOauth2AccessToken(val);
                  updateOAuth2();
                }}
                placeholder="Optional existing access token"
                backgroundColor={colors.bg.panel}
                textColor={colors.text.primary}
                keyBindings={selectAllBindings}
              />
            </box>

            <text fg={colors.text.muted}>Refresh Token (optional seed):</text>
            <box style={{ border: true, borderColor: colors.border.default, paddingLeft: 1 }}>
              <input
                value={oauth2RefreshToken}
                onInput={(val) => {
                  setOauth2RefreshToken(val);
                  updateOAuth2();
                }}
                placeholder="Optional existing refresh token"
                backgroundColor={colors.bg.panel}
                textColor={colors.text.primary}
                keyBindings={selectAllBindings}
              />
            </box>
          </box>
        )}

        {currentAuth.type === 'none' && (
          <text fg={colors.text.dim} style={{ marginTop: 1 }}>
            <em>No authentication configured. Requests will be sent without auth headers.</em>
          </text>
        )}
      </scrollbox>
    </box>
  );
}
