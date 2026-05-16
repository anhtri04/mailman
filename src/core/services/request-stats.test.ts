import { describe, expect, test } from 'bun:test';
import {
  buildRequestStats,
  calculateBodyBytes,
  calculateHeaderBytes,
  formatBytes,
} from './request-stats';

function bytes(value: string): number {
  return new TextEncoder().encode(value).length;
}

describe('request-stats', () => {
  test('calculates header bytes using HTTP header line format', () => {
    const headers = {
      Accept: 'application/json',
      'X-Test': 'mailman',
    };

    expect(calculateHeaderBytes(headers)).toBe(
      bytes('Accept: application/json\r\n') + bytes('X-Test: mailman\r\n'),
    );
  });

  test('calculates UTF-8 body bytes', () => {
    expect(calculateBodyBytes('hello')).toBe(5);
    expect(calculateBodyBytes('你好')).toBe(bytes('你好'));
    expect(calculateBodyBytes()).toBe(0);
  });

  test('builds request stats with timings, sizes, content length, and network metadata', () => {
    const stats = buildRequestStats({
      request: {
        url: 'https://api.example.com:8443/users',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"name":"Ada"}',
      },
      response: {
        url: 'https://api.example.com:8443/v2/users',
        redirected: true,
        headers: { 'content-type': 'application/json', 'content-length': '17' },
        body: '{"ok":true}',
      },
      timings: { totalMs: 120, ttfbMs: 40, downloadMs: 80 },
    });

    expect(stats.timings).toEqual({ totalMs: 120, ttfbMs: 40, downloadMs: 80 });
    expect(stats.requestSize.bodyBytes).toBe(bytes('{"name":"Ada"}'));
    expect(stats.requestSize.totalBytes).toBe(
      stats.requestSize.headersBytes + stats.requestSize.bodyBytes,
    );
    expect(stats.responseSize.contentLengthHeader).toBe(17);
    expect(stats.responseSize.totalBytes).toBe(
      stats.responseSize.headersBytes + stats.responseSize.bodyBytes,
    );
    expect(stats.network).toMatchObject({
      url: 'https://api.example.com:8443/users',
      finalUrl: 'https://api.example.com:8443/v2/users',
      protocol: 'https:',
      host: 'api.example.com',
      port: '8443',
      redirected: true,
    });
  });

  test('falls back safely for invalid URLs and invalid content-length values', () => {
    const stats = buildRequestStats({
      request: {
        url: 'not a url',
        method: 'GET',
        headers: {},
      },
      response: {
        headers: { 'content-length': 'nope' },
        body: 'body',
      },
      timings: { totalMs: 1 },
      errorType: 'dns',
    });

    expect(stats.responseSize.contentLengthHeader).toBeUndefined();
    expect(stats.network).toMatchObject({
      url: 'not a url',
      protocol: 'unknown:',
      host: 'not a url',
      redirected: false,
      errorType: 'dns',
    });
  });

  test('formats byte counts for display', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(2 * 1024 * 1024)).toBe('2.00 MB');
  });
});
