import { describe, expect, test } from 'bun:test';
import { BodyEditor } from './BodyEditor';

describe('BodyEditor', () => {
  test('should export BodyEditor component', () => {
    expect(BodyEditor).toBeDefined();
    expect(typeof BodyEditor).toBe('function');
  });

  test('should include select-all key binding for textarea', () => {
    const componentString = BodyEditor.toString();
    expect(componentString).toContain('action: "select-all"');
    expect(componentString).toContain('keyBindings: selectAllBindings');
  });

  test('should use detected or inferred content type', () => {
    const componentString = BodyEditor.toString();
    expect(componentString).toContain('detectedContentType ?? detectContentType(body)');
    expect(componentString).toContain('contentType');
  });

  test('should show body editor metadata and counters', () => {
    const componentString = BodyEditor.toString();
    expect(componentString).toContain('Enter request body...');
    expect(componentString).toContain('chars');
    expect(componentString).toContain('onBodyChange');
  });

  test('should support keyboard formatting shortcut', () => {
    const componentString = BodyEditor.toString();
    expect(componentString).toContain('key.ctrl && key.name === "f"');
    expect(componentString).toContain('formatRequestBody');
    expect(componentString).toContain('replaceText');
  });
});
