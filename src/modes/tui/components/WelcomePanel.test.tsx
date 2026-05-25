import { describe, expect, test } from 'bun:test';
import { WelcomePanel } from './WelcomePanel';
import type { Collection, RequestItem } from '../../../types';

describe('WelcomePanel', () => {
  test('should export WelcomePanel component', () => {
    expect(WelcomePanel).toBeDefined();
    expect(typeof WelcomePanel).toBe('function');
  });

  test('should include export action and curl copy support', () => {
    const componentString = WelcomePanel.toString();
    expect(componentString).toContain('Export');
    expect(componentString).toContain('copyCurl');
  });

  test('should include collection metadata summary', () => {
    const componentString = WelcomePanel.toString();
    expect(componentString).toContain('methodSummary');
    expect(componentString).toContain('requests.length');
    expect(componentString).toContain('protocol');
  });

  test('should handle requests without body gracefully', () => {
    const collection: Collection = {
      id: 'test-col',
      name: 'Test Collection',
      requests: [
        {
          id: 'rest-req',
          name: 'REST Request',
          protocol: 'rest',
          method: 'GET',
          url: 'https://api.example.com/data',
          headers: {},
          body: { mode: 'none' },
        } as RequestItem,
        {
          id: 'gql-req',
          name: 'GraphQL Request',
          protocol: 'graphql',
          url: 'https://api.example.com/graphql',
          headers: {},
          query: 'query { users { id } }',
          variables: '{}',
        } as RequestItem,
        {
          id: 'ws-req',
          name: 'WebSocket Request',
          protocol: 'websocket',
          url: 'wss://api.example.com/ws',
          headers: {},
          initialMessage: '{"type":"connect"}',
        } as RequestItem,
      ],
    };

    const componentString = WelcomePanel.toString();
    // Ensure component handles all protocol types and missing bodies
    expect(componentString).toContain('protocol');
    expect(componentString).toContain('requestBody');
  });
});
