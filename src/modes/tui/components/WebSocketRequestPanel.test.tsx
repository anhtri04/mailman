import { describe, expect, test } from 'bun:test';
import { WebSocketRequestPanel } from './WebSocketRequestPanel';

describe('WebSocketRequestPanel', () => {
  test('should export WebSocketRequestPanel component', () => {
    expect(WebSocketRequestPanel).toBeDefined();
    expect(typeof WebSocketRequestPanel).toBe('function');
  });

  test('should render websocket connection controls', () => {
    const componentString = WebSocketRequestPanel.toString();
    expect(componentString).toContain('Connect');
    expect(componentString).toContain('Disconnect');
    expect(componentString).toContain('Send');
    expect(componentString).toContain('onConnect');
    expect(componentString).toContain('onSendMessage');
    expect(componentString).toContain('onDisconnect');
  });

  test('should expose URL, headers, and message editors', () => {
    const componentString = WebSocketRequestPanel.toString();
    expect(componentString).toContain('wss://example.com/socket');
    expect(componentString).toContain('Headers');
    expect(componentString).toContain('Initial message');
    expect(componentString).toContain('Message to send');
    expect(componentString).toContain('Message payload');
  });

  test('should indicate saved state and request name', () => {
    const componentString = WebSocketRequestPanel.toString();
    expect(componentString).toContain('requestName');
    expect(componentString).toContain('Saved');
    expect(componentString).toContain('Save failed');
  });

  test('should open headers with focused panel keyboard shortcut', () => {
    const componentString = WebSocketRequestPanel.toString();
    expect(componentString).toContain('useKeyboard');
    expect(componentString).toContain('!focused || isModalOpen || activeEditor !== null');
    expect(componentString).toContain('key.ctrl');
    expect(componentString).toContain('key.name?.toLowerCase() !== "h"');
    expect(componentString).toContain('openHeadersTab()');
  });
});
