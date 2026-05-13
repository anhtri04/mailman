// Request and response types for the HTTP client

export type Protocol = 'rest' | 'graphql';

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

export interface RequestOptions {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: string;
  auth?: AuthConfig;
}

export interface ResponseState {
  status: number;
  statusText: string;
  body: string;
  headers: Record<string, string>;
  time: number;
  mode?: 'single' | 'sse';
  isStreaming?: boolean;
  streamStartedAt?: number;
  streamEndedAt?: number;
  streamEventCount?: number;
  sseEvents?: SSEEvent[];
  sseMeta?: SSEMeta;
}

export interface SSEEvent {
  id?: string;
  event?: string;
  data: string;
  retry?: number;
  timestamp: number;
  raw?: string;
}

export interface SSEMeta {
  lastEventId?: string;
  retryMs?: number;
  droppedEvents?: number;
}

export interface Collection {
  id: string;
  name: string;
  protocol: Protocol;
  requests: RequestItem[];
}

export interface RequestItem {
  id: string;
  name: string;
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: string;
  variables?: string;
  auth?: AuthConfig;
}

export type FocusArea = 'request' | 'response' | 'collections' | null;

export interface AppState {
  focusedArea: FocusArea;
  request: RequestOptions;
  response: ResponseState | null;
  isLoading: boolean;
}
