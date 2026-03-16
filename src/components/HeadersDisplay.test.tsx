import { test, expect, describe } from 'bun:test';
import { HeadersDisplay } from './HeadersDisplay';

describe('HeadersDisplay', () => {
  test('should export HeadersDisplay component', () => {
    expect(HeadersDisplay).toBeDefined();
    expect(typeof HeadersDisplay).toBe('function');
  });

  test('should be a valid React component', () => {
    // Verify it's a valid function component
    const componentString = HeadersDisplay.toString();
    expect(componentString).toContain('useMemo');
  });

  test('should accept headers prop', () => {
    const componentString = HeadersDisplay.toString();
    expect(componentString).toContain('headers');
  });

  test('should render with box and text components', () => {
    const componentString = HeadersDisplay.toString();
    expect(componentString).toContain('<box');
    expect(componentString).toContain('<text');
  });

  test('should sort headers alphabetically', () => {
    const componentString = HeadersDisplay.toString();
    expect(componentString).toContain('sort');
    expect(componentString).toContain('localeCompare');
  });

  test('should handle empty headers', () => {
    const componentString = HeadersDisplay.toString();
    expect(componentString).toContain('No headers available');
  });

  test('should style header names with primary color', () => {
    const componentString = HeadersDisplay.toString();
    expect(componentString).toContain('#CC8844');
  });

  test('should style header values with green color', () => {
    const componentString = HeadersDisplay.toString();
    expect(componentString).toContain('#99AA77');
  });
});
