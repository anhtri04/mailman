import { describe, expect, test } from 'bun:test';
import { GraphQLRequestPanel } from './GraphQLRequestPanel';

describe('GraphQLRequestPanel', () => {
  test('should export GraphQLRequestPanel component', () => {
    expect(GraphQLRequestPanel).toBeDefined();
    expect(typeof GraphQLRequestPanel).toBe('function');
  });

  test('should include select-all key binding support', () => {
    const componentString = GraphQLRequestPanel.toString();
    expect(componentString).toContain('action: "select-all"');
    expect(componentString).toContain('keyBindings: selectAllBindings');
  });

  test('should render GraphQL query and variables editors', () => {
    const componentString = GraphQLRequestPanel.toString();
    expect(componentString).toContain('children: "Query"');
    expect(componentString).toContain('children: "Variables"');
    expect(componentString).toContain('Enter GraphQL query or mutation...');
  });

  test('should provide headers and auth tab controls', () => {
    const componentString = GraphQLRequestPanel.toString();
    expect(componentString).toContain('renderTabButton("headers", "Headers"');
    expect(componentString).toContain('renderTabButton("auth", "Auth"');
    expect(componentString).toContain('onOpenHeaders');
    expect(componentString).toContain('onOpenAuth');
  });
});
