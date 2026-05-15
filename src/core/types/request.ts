import type { AuthConfig } from './auth';

export interface RequestOptions {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: string;
  auth?: AuthConfig;
}
