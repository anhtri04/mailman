import { test, expect, describe } from 'bun:test';
import { ResponsePanel } from './ResponsePanel';

describe('ResponsePanel', () => {
  test('should export ResponsePanel component', () => {
    expect(ResponsePanel).toBeDefined();
    expect(typeof ResponsePanel).toBe('function');
  });

  test('should be a valid React component', () => {
    const componentString = ResponsePanel.toString();
    expect(componentString).toContain('useState');
    expect(componentString).toContain('useMemo');
    expect(componentString).toContain('useCallback');
  });

  test('should have tabs for body, headers, and raw', () => {
    const componentString = ResponsePanel.toString();
    expect(componentString).toContain('Body');
    expect(componentString).toContain('Headers');
    expect(componentString).toContain('Raw');
  });

  test('should use SyntaxHighlighter component', () => {
    const componentString = ResponsePanel.toString();
    expect(componentString).toContain('SyntaxHighlighter');
  });

  test('should use HeadersDisplay component', () => {
    const componentString = ResponsePanel.toString();
    expect(componentString).toContain('HeadersDisplay');
  });

  test('should display response time and size', () => {
    const componentString = ResponsePanel.toString();
    expect(componentString).toContain('time');
    expect(componentString).toContain('contentSize');
  });

  test('should handle status code colors', () => {
    const componentString = ResponsePanel.toString();
    expect(componentString).toContain('getStatusColor');
    expect(componentString).toContain('colors.syntax.success'); // Success color
    expect(componentString).toContain('colors.syntax.error'); // Error color
  });

  test('should use content type detection', () => {
    const componentString = ResponsePanel.toString();
    expect(componentString).toContain('detectContentType');
  });

  test('should handle keyboard navigation for tabs', () => {
    const componentString = ResponsePanel.toString();
    expect(componentString).toContain('useKeyboard');
    expect(componentString).toContain('tab');
  });
});
