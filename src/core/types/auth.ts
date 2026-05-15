export type AuthType = 'none' | 'bearer' | 'api-key' | 'basic' | 'oauth2';

export type OAuth2GrantType = 'client_credentials' | 'authorization_code';

export interface OAuth2Config {
  grantType: OAuth2GrantType;
  tokenUrl: string;
  clientId: string;
  clientSecret?: string;
  scope?: string;
  code?: string;
  redirectUri?: string;
  codeVerifier?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  tokenType?: string;
}

export interface AuthConfig {
  type: AuthType;
  token?: string;
  key?: string;
  value?: string;
  location?: 'header' | 'query';
  username?: string;
  password?: string;
  oauth2?: OAuth2Config;
}
