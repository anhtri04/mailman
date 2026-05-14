import { describe, expect, test } from 'bun:test';
import { parseUnifiedInput } from './unifiedInputParser';

describe('parseUnifiedInput', () => {
  test('parses slash command', () => {
    const parsed = parseUnifiedInput('/show headers');
    expect(parsed.kind).toBe('command');
    if (parsed.kind !== 'command') return;
    expect(parsed.name).toBe('show');
    expect(parsed.args).toEqual(['headers']);
  });

  test('parses method url shorthand request', () => {
    const parsed = parseUnifiedInput('GET https://example.com');
    expect(parsed.kind).toBe('request');
    if (parsed.kind !== 'request') return;
    expect(parsed.request.method).toBe('GET');
    expect(parsed.request.url).toBe('https://example.com');
  });

  test('parses curl request', () => {
    const parsed = parseUnifiedInput('curl -X POST https://example.com -d \'{"a":1}\'');
    expect(parsed.kind).toBe('request');
    if (parsed.kind !== 'request') return;
    expect(parsed.request.method).toBe('POST');
    expect(parsed.request.url).toBe('https://example.com');
    expect(parsed.request.body).toBe('{"a":1}');
  });
});
