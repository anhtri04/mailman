import { describe, expect, test } from 'bun:test';
import { buildRequestBody, requestBodyHasContent, summarizeRequestBody } from './request-body';
import type { RequestBody } from '../types';

describe('request-body', () => {
  test('builds urlencoded request bodies', () => {
    const body: RequestBody = {
      mode: 'urlencoded',
      fields: [
        { id: '1', enabled: true, key: 'name', value: 'Ada' },
        { id: '2', enabled: false, key: 'skip', value: 'yes' },
      ],
    };

    const built = buildRequestBody(body, {});

    expect(built.body).toBeInstanceOf(URLSearchParams);
    expect(built.body?.toString()).toBe('name=Ada');
    expect(built.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
    expect(built.statsBody).toBe('name=Ada');
  });

  test('builds multipart request bodies and strips manual content type', () => {
    const body: RequestBody = {
      mode: 'multipart',
      fields: [
        { id: '1', enabled: true, kind: 'text', name: 'name', value: 'Ada' },
        { id: '2', enabled: true, kind: 'file', name: 'avatar', filePath: '/tmp/avatar.png' },
      ],
    };

    const built = buildRequestBody(body, { 'Content-Type': 'multipart/form-data' });

    expect(built.body).toBeInstanceOf(FormData);
    expect(built.headers['Content-Type']).toBeUndefined();
    expect(built.statsBody).toBe('name=Ada, avatar=@/tmp/avatar.png');
  });

  test('summarizes and detects structured body content', () => {
    const body: RequestBody = {
      mode: 'file',
      filePath: '/tmp/payload.bin',
    };

    expect(requestBodyHasContent(body)).toBe(true);
    expect(summarizeRequestBody(body)).toBe('file: /tmp/payload.bin');
  });
});
