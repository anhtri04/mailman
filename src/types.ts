// Request and response types for the HTTP client

export type Protocol = 'rest' | 'graphql';

export type AuthType = 'none' | 'bearer' | 'api-key';

export interface AuthConfig {
  type: AuthType;
  token?: string;
  key?: string;
  value?: string;
  location?: 'header' | 'query';
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
