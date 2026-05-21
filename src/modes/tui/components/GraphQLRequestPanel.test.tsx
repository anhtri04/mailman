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

  test('should provide headers, auth, and scripts tab controls', () => {
    const componentString = GraphQLRequestPanel.toString();
    expect(componentString).toContain('renderTabButton("headers", "Headers"');
    expect(componentString).toContain('renderTabButton("auth", "Auth"');
    expect(componentString).toContain('renderTabButton("scripts", "Scripts"');
    expect(componentString).toContain('onOpenHeaders');
    expect(componentString).toContain('onOpenAuth');
    expect(componentString).toContain('onOpenScripts');
  });

  test('should focus request panel when clicking GraphQL request tabs', () => {
    const componentString = GraphQLRequestPanel.toString();
    expect(componentString).toContain('onFocus()');
    expect(componentString).toContain('onOpenHeaders()');
    expect(componentString).toContain('onOpenAuth()');
    expect(componentString).toContain('onOpenScripts()');
    expect(componentString).toContain(
      '[onFocus, activeTab, onOpenHeaders, onOpenAuth, onOpenScripts]',
    );
  });

  test('should format the active GraphQL editor with keyboard shortcut', () => {
    const componentString = GraphQLRequestPanel.toString();
    expect(componentString).toContain('key.ctrl && key.name === "f"');
    expect(componentString).toContain('activeEditor === "query"');
    expect(componentString).toContain('activeEditor === "variables"');
    expect(componentString).toContain('formatGraphQLQuery');
    expect(componentString).toContain('formatGraphQLVariables');
    expect(componentString).toContain('replaceText');
  });
});
