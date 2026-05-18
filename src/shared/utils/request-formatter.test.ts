import { describe, expect, test } from 'bun:test';
import { formatGraphQLQuery, formatGraphQLVariables, formatRequestBody } from './request-formatter';

describe('request-formatter', () => {
  describe('formatRequestBody', () => {
    test('formats JSON request bodies', () => {
      const result = formatRequestBody('{"name":"Ada","age":36}', 'application/json');

      expect(result.error).toBeUndefined();
      expect(result.changed).toBe(true);
      expect(result.value).toBe('{\n  "name": "Ada",\n  "age": 36\n}');
    });

    test('returns an error for invalid JSON request bodies', () => {
      const result = formatRequestBody('{invalid', 'application/json');

      expect(result.changed).toBe(false);
      expect(result.error).toBe('Invalid JSON');
      expect(result.value).toBe('{invalid');
    });

    test('formats XML request bodies', () => {
      const result = formatRequestBody('<root><child>value</child></root>', 'application/xml');

      expect(result.error).toBeUndefined();
      expect(result.changed).toBe(true);
      expect(result.value).toContain('\n');
      expect(result.value).toContain('<child>');
    });

    test('detects already formatted JSON request bodies without content type', () => {
      const input = '{\n  "name": "Ada"\n}';
      const result = formatRequestBody(input, 'text/plain');

      expect(result.error).toBeUndefined();
      expect(result.changed).toBe(false);
      expect(result.value).toBe(input);
    });

    test('reports non-formatable request bodies', () => {
      const result = formatRequestBody('plain text', 'text/plain');

      expect(result.changed).toBe(false);
      expect(result.error).toBe('Nothing to format');
      expect(result.value).toBe('plain text');
    });
  });

  describe('formatGraphQLVariables', () => {
    test('formats GraphQL variables JSON', () => {
      const result = formatGraphQLVariables('{"id":"123","filter":{"active":true}}');

      expect(result.error).toBeUndefined();
      expect(result.changed).toBe(true);
      expect(result.value).toBe('{\n  "id": "123",\n  "filter": {\n    "active": true\n  }\n}');
    });

    test('returns an error for invalid GraphQL variables JSON', () => {
      const result = formatGraphQLVariables('{invalid');

      expect(result.changed).toBe(false);
      expect(result.error).toBe('Invalid JSON');
    });
  });

  describe('formatGraphQLQuery', () => {
    test('formats compact GraphQL queries', () => {
      const result = formatGraphQLQuery(
        'query GetUser($id:ID!){user(id:$id){id name posts{title}}}',
      );

      expect(result.error).toBeUndefined();
      expect(result.changed).toBe(true);
      expect(result.value).toBe(
        'query GetUser($id: ID!) {\n  user(id: $id) {\n    id name posts {\n      title\n    }\n  }\n}',
      );
    });

    test('returns an error for unbalanced GraphQL queries', () => {
      const result = formatGraphQLQuery('query { user { id }');

      expect(result.changed).toBe(false);
      expect(result.error).toBe('Invalid GraphQL query');
    });
  });
});
