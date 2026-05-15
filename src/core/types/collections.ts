import type { AuthConfig } from './auth';

export type Protocol = 'rest' | 'graphql';

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
