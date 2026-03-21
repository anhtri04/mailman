import { test, expect, describe } from 'bun:test';
import {
  detectContentType,
  formatJson,
  formatXml,
  formatResponseBody,
  parseJsonForHighlighting,
  getTokenColor,
  type ContentType,
  type Token,
} from './response-formatter';

describe('response-formatter', () => {
  describe('detectContentType', () => {
    test('should detect JSON from content-type header', () => {
      const headers = { 'content-type': 'application/json' };
      expect(detectContentType(headers, '{}')).toBe('json');
    });

    test('should detect JSON with charset', () => {
      const headers = { 'content-type': 'application/json; charset=utf-8' };
      expect(detectContentType(headers, '{}')).toBe('json');
    });

    test('should detect XML from content-type header', () => {
      const headers = { 'content-type': 'application/xml' };
      expect(detectContentType(headers, '<root></root>')).toBe('xml');
    });

    test('should detect HTML from content-type header', () => {
      const headers = { 'content-type': 'text/html' };
      expect(detectContentType(headers, '<html></html>')).toBe('html');
    });

    test('should detect plain text from content-type header', () => {
      const headers = { 'content-type': 'text/plain' };
      expect(detectContentType(headers, 'Hello')).toBe('text');
    });

    test('should detect binary content', () => {
      const headers = { 'content-type': 'application/octet-stream' };
      expect(detectContentType(headers, 'binary')).toBe('binary');
    });

    test('should detect JSON from body when no header', () => {
      const headers = {};
      expect(detectContentType(headers, '{"key": "value"}')).toBe('json');
    });

    test('should detect JSON array from body', () => {
      const headers = {};
      expect(detectContentType(headers, '[1, 2, 3]')).toBe('json');
    });

    test('should detect HTML from body when no header', () => {
      const headers = {};
      expect(detectContentType(headers, '<!DOCTYPE html><html></html>')).toBe('html');
    });

    test('should detect XML from body when no header', () => {
      const headers = {};
      expect(detectContentType(headers, '<root><child/></root>')).toBe('xml');
    });

    test('should fallback to text for unknown content', () => {
      const headers = {};
      expect(detectContentType(headers, 'Some plain text')).toBe('text');
    });

    test('should handle case-insensitive content-type', () => {
      const headers = { 'Content-Type': 'Application/JSON' };
      expect(detectContentType(headers, '{}')).toBe('json');
    });
  });

  describe('formatJson', () => {
    test('should pretty print valid JSON object', () => {
      const input = '{"name":"John","age":30}';
      const expected = '{\n  "name": "John",\n  "age": 30\n}';
      expect(formatJson(input)).toBe(expected);
    });

    test('should pretty print JSON array', () => {
      const input = '[1,2,3]';
      const expected = '[\n  1,\n  2,\n  3\n]';
      expect(formatJson(input)).toBe(expected);
    });

    test('should return original on invalid JSON', () => {
      const input = 'not valid json';
      expect(formatJson(input)).toBe(input);
    });

    test('should handle nested objects', () => {
      const input = '{"user":{"name":"John"},"items":[1,2]}';
      const result = formatJson(input);
      expect(result).toContain('\n');
      expect(result).toContain('  "user"');
    });
  });

  describe('formatXml', () => {
    test('should format simple XML with indentation', () => {
      const input = '<root><child>value</child></root>';
      const result = formatXml(input);
      expect(result).toContain('<root>');
      expect(result).toContain('  <child>');
      expect(result).toContain('</root>');
    });

    test('should format HTML', () => {
      const input = '<html><body><p>text</p></body></html>';
      const result = formatXml(input);
      expect(result).toContain('<html>');
      expect(result).toContain('<body>');
    });

    test('should handle self-closing tags', () => {
      const input = '<root><child/><child/></root>';
      const result = formatXml(input);
      expect(result).toContain('<root>');
      expect(result).toContain('<child/>');
    });

    test('should return original if formatting fails', () => {
      const input = '';
      expect(formatXml(input)).toBe(input);
    });
  });

  describe('formatResponseBody', () => {
    test('should format JSON content', () => {
      const input = '{"key":"value"}';
      const result = formatResponseBody(input, 'json');
      expect(result).toContain('\n');
    });

    test('should format XML content', () => {
      const input = '<root><child/></root>';
      const result = formatResponseBody(input, 'xml');
      expect(result).toContain('\n');
    });

    test('should format HTML content', () => {
      const input = '<html><body></body></html>';
      const result = formatResponseBody(input, 'html');
      expect(result).toContain('<html>');
    });

    test('should return plain text as-is', () => {
      const input = 'Hello world';
      expect(formatResponseBody(input, 'text')).toBe(input);
    });

    test('should show placeholder for binary content', () => {
      const input = 'binary data';
      expect(formatResponseBody(input, 'binary')).toBe('[Binary content - cannot display]');
    });

    test('should return original for unknown type', () => {
      const input = 'some content';
      expect(formatResponseBody(input, 'unknown')).toBe(input);
    });
  });

  describe('parseJsonForHighlighting', () => {
    test('should parse simple JSON object', () => {
      const input = '{"name": "John"}';
      const tokens = parseJsonForHighlighting(input);
      expect(tokens.length).toBeGreaterThan(0);

      const keyToken = tokens.find((t: Token) => t.type === 'key');
      expect(keyToken).toBeDefined();
      expect(keyToken?.value).toBe('"name"');
    });

    test('should parse JSON with strings', () => {
      const input = '{"message": "hello"}';
      const tokens = parseJsonForHighlighting(input);

      const stringToken = tokens.find((t: Token) => t.type === 'string');
      expect(stringToken).toBeDefined();
      expect(stringToken?.value).toBe('"hello"');
    });

    test('should parse JSON with numbers', () => {
      const input = '{"count": 42}';
      const tokens = parseJsonForHighlighting(input);

      const numberToken = tokens.find((t: Token) => t.type === 'number');
      expect(numberToken).toBeDefined();
      expect(numberToken?.value).toBe('42');
    });

    test('should parse JSON with booleans', () => {
      const input = '{"active": true, "disabled": false}';
      const tokens = parseJsonForHighlighting(input);

      const boolTokens = tokens.filter((t: Token) => t.type === 'boolean');
      expect(boolTokens.length).toBe(2);
    });

    test('should parse JSON with null', () => {
      const input = '{"value": null}';
      const tokens = parseJsonForHighlighting(input);

      const nullToken = tokens.find((t: Token) => t.type === 'null');
      expect(nullToken).toBeDefined();
      expect(nullToken?.value).toBe('null');
    });

    test('should parse JSON brackets', () => {
      const input = '{"items": [1, 2]}';
      const tokens = parseJsonForHighlighting(input);

      const bracketTokens = tokens.filter((t: Token) => t.type === 'bracket');
      expect(bracketTokens.length).toBeGreaterThan(0);
    });

    test('should handle invalid JSON gracefully', () => {
      const input = 'not json';
      const tokens = parseJsonForHighlighting(input);
      // Invalid JSON returns the body as a single string token
      expect(tokens.length).toBeGreaterThanOrEqual(1);
      expect(tokens[0]?.value).toBe(input);
    });

    test('should parse nested objects', () => {
      const input = '{"user": {"name": "John"}}';
      const tokens = parseJsonForHighlighting(input);

      const keyTokens = tokens.filter((t: Token) => t.type === 'key');
      expect(keyTokens.length).toBe(2); // "user" and "name"
    });
  });

  describe('getTokenColor', () => {
    test('should return primary color for keys', () => {
      expect(getTokenColor('key')).toBe('#CC8844');
    });

    test('should return green for strings', () => {
      expect(getTokenColor('string')).toBe('#99AA77');
    });

    test('should return secondary color for numbers', () => {
      expect(getTokenColor('number')).toBe('#BB7733');
    });

    test('should return muted color for booleans', () => {
      expect(getTokenColor('boolean')).toBe('#999999');
    });

    test('should return muted color for null', () => {
      expect(getTokenColor('null')).toBe('#999999');
    });

    test('should return white for brackets', () => {
      expect(getTokenColor('bracket')).toBe('#FFFFFF');
    });

    test('should return white for comma', () => {
      expect(getTokenColor('comma')).toBe('#FFFFFF');
    });

    test('should return white for colon', () => {
      expect(getTokenColor('colon')).toBe('#FFFFFF');
    });

    test('should return white for whitespace', () => {
      expect(getTokenColor('whitespace')).toBe('#FFFFFF');
    });
  });
});
