import { basename } from 'path';
import type { RequestBody } from '../types';

export type FetchBody = string | URLSearchParams | FormData | Blob;

export interface BuiltRequestBody {
  body?: FetchBody;
  headers: Record<string, string>;
  statsBody?: string;
}

export function emptyRequestBody(): RequestBody {
  return { mode: 'none' };
}

export function rawRequestBody(content = ''): RequestBody {
  return { mode: 'raw', content };
}

function hasHeader(headers: Record<string, string>, name: string): boolean {
  return Object.keys(headers).some((key) => key.toLowerCase() === name.toLowerCase());
}

function withHeaderIfMissing(
  headers: Record<string, string>,
  name: string,
  value: string,
): Record<string, string> {
  if (hasHeader(headers, name)) return headers;
  return { ...headers, [name]: value };
}

function withoutContentType(headers: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers).filter(([key]) => key.toLowerCase() !== 'content-type'),
  );
}

export function normalizeRequestBody(body?: RequestBody | string): RequestBody {
  if (!body) return emptyRequestBody();
  if (typeof body === 'string') return rawRequestBody(body);
  return body;
}

export function requestBodyHasContent(body: RequestBody): boolean {
  switch (body.mode) {
    case 'none':
      return false;
    case 'raw':
      return body.content.trim().length > 0;
    case 'urlencoded':
      return body.fields.some((field) => field.enabled && field.key.trim().length > 0);
    case 'file':
      return body.filePath.trim().length > 0;
    case 'multipart':
      return body.fields.some((field) => {
        if (!field.enabled || !field.name.trim()) return false;
        return field.kind === 'text'
          ? field.value.trim().length > 0
          : field.filePath.trim().length > 0;
      });
  }
}

export function summarizeRequestBody(body: RequestBody): string {
  switch (body.mode) {
    case 'none':
      return '';
    case 'raw':
      return body.content;
    case 'urlencoded':
      return body.fields
        .filter((field) => field.enabled && field.key.trim())
        .map((field) => `${field.key}=${field.value}`)
        .join('&');
    case 'file':
      return body.filePath ? `file: ${body.filePath}` : '';
    case 'multipart':
      return body.fields
        .filter((field) => field.enabled && field.name.trim())
        .map((field) =>
          field.kind === 'file'
            ? `${field.name}=@${field.filePath}`
            : `${field.name}=${field.value}`,
        )
        .join(', ');
  }
}

export function buildRequestBody(
  inputBody: RequestBody | string | undefined,
  headers: Record<string, string>,
): BuiltRequestBody {
  const requestBody = normalizeRequestBody(inputBody);
  switch (requestBody.mode) {
    case 'none':
      return { headers };

    case 'raw':
      return {
        body: requestBody.content,
        headers,
        statsBody: requestBody.content,
      };

    case 'urlencoded': {
      const params = new URLSearchParams();
      for (const field of requestBody.fields) {
        if (!field.enabled || !field.key.trim()) continue;
        params.append(field.key, field.value);
      }
      const statsBody = params.toString();
      return {
        body: params,
        headers: withHeaderIfMissing(headers, 'Content-Type', 'application/x-www-form-urlencoded'),
        statsBody,
      };
    }

    case 'file': {
      if (!requestBody.filePath.trim()) return { headers };
      return {
        body: Bun.file(requestBody.filePath),
        headers: requestBody.contentType?.trim()
          ? withHeaderIfMissing(headers, 'Content-Type', requestBody.contentType.trim())
          : headers,
        statsBody: summarizeRequestBody(requestBody),
      };
    }

    case 'multipart': {
      const form = new FormData();
      for (const field of requestBody.fields) {
        if (!field.enabled || !field.name.trim()) continue;
        if (field.kind === 'text') {
          form.append(field.name, field.value);
          continue;
        }
        if (!field.filePath.trim()) continue;
        const file = Bun.file(field.filePath);
        form.append(field.name, file, field.filename?.trim() || basename(field.filePath));
      }

      return {
        body: form,
        headers: withoutContentType(headers),
        statsBody: summarizeRequestBody(requestBody),
      };
    }
  }
}
