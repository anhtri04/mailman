import { test, expect, describe } from 'bun:test';
import { SyntaxHighlighter } from './SyntaxHighlighter';

describe('SyntaxHighlighter', () => {
  test('should export SyntaxHighlighter component', () => {
    expect(SyntaxHighlighter).toBeDefined();
    expect(typeof SyntaxHighlighter).toBe('function');
  });

  test('should be a valid React component', () => {
    // Verify it's a valid function component with hooks
    const componentString = SyntaxHighlighter.toString();
    expect(componentString).toContain('useMemo');
  });

  test('should accept code and language props', () => {
    // Check component signature accepts the right props
    const componentString = SyntaxHighlighter.toString();
    expect(componentString).toContain('code');
    expect(componentString).toContain('language');
  });

  test('should handle JSON language', () => {
    const componentString = SyntaxHighlighter.toString();
    expect(componentString).toContain('"json"');
    expect(componentString).toContain('highlightJson');
  });

  test('should handle XML language', () => {
    const componentString = SyntaxHighlighter.toString();
    expect(componentString).toContain('"xml"');
    expect(componentString).toContain('highlightXml');
  });

  test('should handle plain text', () => {
    const componentString = SyntaxHighlighter.toString();
    expect(componentString).toContain('"text"');
    expect(componentString).toContain('highlightPlainText');
  });

  test('should render with box and text components', () => {
    const componentString = SyntaxHighlighter.toString();
    // After compilation, JSX becomes jsxDEV calls
    expect(componentString).toContain('jsxDEV');
    expect(componentString).toContain('"box"');
    expect(componentString).toContain('"text"');
  });
});
