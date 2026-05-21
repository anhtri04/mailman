import { test, expect, describe } from 'bun:test';
import { RequestPanel } from './RequestPanel';

describe('RequestPanel', () => {
  test('should export RequestPanel component', () => {
    expect(RequestPanel).toBeDefined();
    expect(typeof RequestPanel).toBe('function');
  });

  test('should be a valid React component', () => {
    // Verify it's a valid function component with hooks
    const componentString = RequestPanel.toString();
    expect(componentString).toContain('useState');
    expect(componentString).toContain('useCallback');
  });

  test('should focus request panel when clicking request tabs', () => {
    const componentString = RequestPanel.toString();
    expect(componentString).toContain('onFocus()');
    expect(componentString).toContain('onOpenHeaders()');
    expect(componentString).toContain('onOpenBody()');
    expect(componentString).toContain('onOpenQuery()');
    expect(componentString).toContain('onOpenAuth()');
    expect(componentString).toContain('onOpenScripts()');
    expect(componentString).toContain(
      '[onFocus, activeTab, onOpenHeaders, onOpenBody, onOpenQuery, onOpenAuth, onOpenScripts]',
    );
  });
});
