import type { AuthConfig } from './auth';
import type { RequestScripts } from './scripts';

export interface RequestOptions {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: string;
  auth?: AuthConfig;
  scripts?: RequestScripts;
}
