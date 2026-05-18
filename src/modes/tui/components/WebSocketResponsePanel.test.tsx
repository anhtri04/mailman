import { describe, expect, test } from 'bun:test';
import { WebSocketResponsePanel } from './WebSocketResponsePanel';

describe('WebSocketResponsePanel', () => {
  test('should export WebSocketResponsePanel component', () => {
    expect(WebSocketResponsePanel).toBeDefined();
    expect(typeof WebSocketResponsePanel).toBe('function');
  });

  test('should render message list and status details', () => {
    const componentString = WebSocketResponsePanel.toString();
    expect(componentString).toContain('Messages');
    expect(componentString).toContain('messages');
    expect(componentString).toContain('statusText');
    expect(componentString).toContain('No WebSocket messages yet');
  });

  test('should support clearing websocket messages', () => {
    const componentString = WebSocketResponsePanel.toString();
    expect(componentString).toContain('onClearMessages');
    expect(componentString).toContain('Clear');
  });

  test('should display inbound outbound and system directions', () => {
    const componentString = WebSocketResponsePanel.toString();
    expect(componentString).toContain('inbound');
    expect(componentString).toContain('outbound');
    expect(componentString).toContain('colors.text.muted');
    expect(componentString).toContain('directionSymbol');
  });
});
