import { test, expect, describe } from 'bun:test';
import { RequestPanel } from './RequestPanel';

describe('RequestPanel', () => {
  const defaultProps = {
    focused: false,
    onFocus: () => {},
    url: '',
    onUrlChange: () => {},
    method: 'GET',
    onMethodChange: () => {},
    onSend: () => {},
  };

  test('should export RequestPanel component', () => {
    expect(RequestPanel).toBeDefined();
  });

  test('should accept all required props', () => {
    const props = {
      ...defaultProps,
      focused: true,
      url: 'https://example.com',
      method: 'POST',
    };
    
    expect(() => RequestPanel(props)).not.toThrow();
  });
});
