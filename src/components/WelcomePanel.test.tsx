import { describe, expect, test } from 'bun:test';
import { WelcomePanel } from './WelcomePanel';

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
});
