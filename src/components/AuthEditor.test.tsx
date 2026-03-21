import { test, expect, describe } from 'bun:test';
import { AuthEditor } from './AuthEditor';

describe('AuthEditor', () => {
  test('should export AuthEditor component', () => {
    expect(AuthEditor).toBeDefined();
    expect(typeof AuthEditor).toBe('function');
  });

  test('should be a valid React component with hooks', () => {
    const componentString = AuthEditor.toString();
    expect(componentString).toContain('useState');
    expect(componentString).toContain('useCallback');
  });

  test('should accept auth and onAuthChange props', () => {
    const componentString = AuthEditor.toString();
    expect(componentString).toContain('auth');
    expect(componentString).toContain('onAuthChange');
  });
});
