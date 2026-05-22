import { describe, expect, test } from 'bun:test';
import { Notification } from './Notification';

describe('Notification', () => {
  test('should export Notification component', () => {
    expect(Notification).toBeDefined();
    expect(typeof Notification).toBe('function');
  });

  test('should support generic notification variants', () => {
    const componentString = Notification.toString();

    expect(componentString).toContain('variant = "info"');
    expect(componentString).toContain('variant === "error"');
    expect(componentString).toContain('variant === "warning"');
    expect(componentString).toContain('variant === "success"');
    expect(componentString).toContain('colors.accent.primary');
  });

  test('should not render when closed', () => {
    const componentString = Notification.toString();

    expect(componentString).toContain('if (!isOpen)');
    expect(componentString).toContain('return null');
  });

  test('should render title, message, custom children, and close affordance', () => {
    const componentString = Notification.toString();

    expect(componentString).toContain('children: title');
    expect(componentString).toContain('children: message');
    expect(componentString).toContain('children');
    expect(componentString).toContain('[esc]');
    expect(componentString).toContain('onMouseDown: onClose');
  });

  test('should render configurable action buttons', () => {
    const componentString = Notification.toString();

    expect(componentString).toContain('actions.length > 0');
    expect(componentString).toContain('actions.map');
    expect(componentString).toContain('action.variant ===');
    expect(componentString).toContain('action.onPress');
    expect(componentString).toContain('children: action.label');
  });
});
