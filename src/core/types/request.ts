import type { AuthConfig } from './auth';
import type { RequestScripts } from './scripts';

export type RequestBodyMode = 'none' | 'raw' | 'urlencoded' | 'file' | 'multipart';

export interface RawRequestBody {
  mode: 'raw';
  content: string;
}

export interface UrlEncodedField {
  id: string;
  enabled: boolean;
  key: string;
  value: string;
}

export interface UrlEncodedRequestBody {
  mode: 'urlencoded';
  fields: UrlEncodedField[];
}

export interface FileRequestBody {
  mode: 'file';
  filePath: string;
  contentType?: string;
}

export interface MultipartTextField {
  id: string;
  enabled: boolean;
  kind: 'text';
  name: string;
  value: string;
}

export interface MultipartFileField {
  id: string;
  enabled: boolean;
  kind: 'file';
  name: string;
  filePath: string;
  filename?: string;
  contentType?: string;
}

export type MultipartField = MultipartTextField | MultipartFileField;

export interface MultipartRequestBody {
  mode: 'multipart';
  fields: MultipartField[];
}

export type RequestBody =
  | { mode: 'none' }
  | RawRequestBody
  | UrlEncodedRequestBody
  | FileRequestBody
  | MultipartRequestBody;

export interface RequestOptions {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: RequestBody;
  auth?: AuthConfig;
  scripts?: RequestScripts;
}
