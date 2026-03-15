import { test, expect, describe } from 'bun:test';
import { ResponsePanel } from './ResponsePanel';

describe('ResponsePanel', () => {
  const defaultProps = {
    focused: false,
    onFocus: () => {},
    response: null,
  };

  test('should export ResponsePanel component', () => {
    expect(ResponsePanel).toBeDefined();
  });

  test('should accept all required props', () => {
    const response = {
      status: 200,
      statusText: 'OK',
      body: '{"message": "success"}',
      headers: {},
      time: 150,
    };

    expect(() => ResponsePanel({ ...defaultProps, response })).not.toThrow();
  });
});
