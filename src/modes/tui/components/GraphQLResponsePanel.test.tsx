import { describe, expect, test } from 'bun:test';
import { GraphQLResponsePanel } from './GraphQLResponsePanel';

describe('GraphQLResponsePanel', () => {
  test('should export GraphQLResponsePanel component', () => {
    expect(GraphQLResponsePanel).toBeDefined();
    expect(typeof GraphQLResponsePanel).toBe('function');
  });

  test('should include GraphQL response tabs', () => {
    const componentString = GraphQLResponsePanel.toString();
    expect(componentString).toContain('availableTabs.indexOf(activeTab)');
    expect(componentString).toContain('renderTabButton("body", "Body")');
    expect(componentString).toContain('renderTabButton("headers", "Headers")');
    expect(componentString).toContain('renderTabButton("raw", "Raw")');
    expect(componentString).toContain('renderTabButton("errors", "Errors")');
    expect(componentString).toContain('renderTabButton("test", "Test")');
  });

  test('should parse and render GraphQL errors metadata', () => {
    const componentString = GraphQLResponsePanel.toString();
    expect(componentString).toContain('Array.isArray(parsedBody.errors)');
    expect(componentString).toContain('No GraphQL errors found.');
    expect(componentString).toContain('Unable to parse response as JSON.');
    expect(componentString).toContain('Path:');
    expect(componentString).toContain('Location: line');
  });

  test('should support keyboard navigation and panel expansion', () => {
    const componentString = GraphQLResponsePanel.toString();
    expect(componentString).toContain('useKeyboard');
    expect(componentString).toContain('key.name === "space"');
    expect(componentString).toContain('key.name === "escape"');
    expect(componentString).toContain('key.name === "tab"');
    expect(componentString).toContain('onToggleExpand');
    expect(componentString).toContain('onActiveTabChange');
  });

  test('should focus response panel when clicking response tabs', () => {
    const componentString = GraphQLResponsePanel.toString();
    expect(componentString).toContain('e.stopPropagation()');
    expect(componentString).toContain('onFocus()');
    expect(componentString).toContain('onActiveTabChange(tab)');
    expect(componentString).toContain('[onFocus, onActiveTabChange]');
  });
});
