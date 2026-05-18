import { describe, expect, test } from 'bun:test';
import { tokenizeGraphQLWithRanges, tokenizeJsonWithRanges } from './textarea-highlighting';

describe('textarea-highlighting', () => {
  describe('tokenizeJsonWithRanges', () => {
    test('tokenizes JSON keys, strings, numbers, booleans, null, and punctuation', () => {
      const input = '{"name":"Ada","age":36,"active":true,"none":null}';
      const tokens = tokenizeJsonWithRanges(input);

      expect(tokens).toContainEqual({ start: 1, end: 7, style: 'key' });
      expect(tokens).toContainEqual({ start: 8, end: 13, style: 'string' });
      expect(tokens).toContainEqual({ start: 20, end: 22, style: 'number' });
      expect(tokens).toContainEqual({ start: 32, end: 36, style: 'boolean' });
      expect(tokens).toContainEqual({ start: 44, end: 48, style: 'null' });
      expect(tokens.some((token) => token.style === 'punctuation')).toBe(true);
    });

    test('keeps string ranges aligned with escaped quotes', () => {
      const input = '{"message":"hello \\"Ada\\""}';
      const tokens = tokenizeJsonWithRanges(input);
      const stringToken = tokens.find((token) => token.style === 'string');

      expect(stringToken).toEqual({ start: 11, end: 26, style: 'string' });
      expect(input.slice(stringToken?.start, stringToken?.end)).toBe('"hello \\"Ada\\""');
    });
  });

  describe('tokenizeGraphQLWithRanges', () => {
    test('tokenizes GraphQL keywords, variables, punctuation, and strings', () => {
      const input = 'query GetUser($id: ID!) { user(id: $id) { name(status: "ACTIVE") } }';
      const tokens = tokenizeGraphQLWithRanges(input);

      expect(tokens).toContainEqual({ start: 0, end: 5, style: 'keyword' });
      expect(tokens).toContainEqual({ start: 14, end: 17, style: 'variable' });
      expect(tokens).toContainEqual({ start: 35, end: 38, style: 'variable' });
      expect(tokens).toContainEqual({ start: 55, end: 63, style: 'string' });
      expect(tokens.some((token) => token.style === 'punctuation')).toBe(true);
    });

    test('tokenizes GraphQL comments and booleans', () => {
      const input = '# comment\nquery { viewer(active: true) { id } }';
      const tokens = tokenizeGraphQLWithRanges(input);

      expect(tokens).toContainEqual({ start: 0, end: 9, style: 'comment' });
      expect(tokens).toContainEqual({ start: 33, end: 37, style: 'boolean' });
    });
  });
});
