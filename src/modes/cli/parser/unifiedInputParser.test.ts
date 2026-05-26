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

  test('parses canonical REST request', () => {
    const parsed = parseUnifiedInput('http rest GET https://example.com');
    expect(parsed.kind).toBe('request');
    if (parsed.kind !== 'request') return;
    expect(parsed.protocol).toBe('rest');
    expect(parsed.request.method).toBe('GET');
    expect(parsed.request.url).toBe('https://example.com');
  });

  test('parses GraphQL request', () => {
    const parsed = parseUnifiedInput(
      "http graphql https://example.com/graphql --query '{ viewer { login } }'",
    );
    expect(parsed.kind).toBe('request');
    if (parsed.kind !== 'request') return;
    expect(parsed.protocol).toBe('graphql');
    expect(parsed.request.method).toBe('POST');
    expect(parsed.request.url).toBe('https://example.com/graphql');
    expect(parsed.request.body).toEqual({
      mode: 'raw',
      content: JSON.stringify({ query: '{ viewer { login } }' }),
    });
  });

  test('parses SSE request', () => {
    const parsed = parseUnifiedInput('http sse https://example.com/events');
    expect(parsed.kind).toBe('request');
    if (parsed.kind !== 'request') return;
    expect(parsed.protocol).toBe('sse');
    expect(parsed.responseMode).toBe('sse');
    expect(parsed.request.method).toBe('GET');
    expect(parsed.request.headers?.Accept).toBe('text/event-stream');
  });

  test('parses shell command', () => {
    const parsed = parseUnifiedInput('cd collection');
    expect(parsed.kind).toBe('shell');
    if (parsed.kind !== 'shell') return;
    expect(parsed.name).toBe('cd');
    expect(parsed.args).toEqual(['collection']);
  });

  test('rejects old method url shorthand', () => {
    expect(() => parseUnifiedInput('GET https://example.com')).toThrow(
      'Unknown input. Start a request with "http", use /help, or run a shell command like ls.',
    );
  });
});
