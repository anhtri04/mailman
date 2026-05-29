import { describe, expect, test } from 'bun:test';
import { BodyEditor } from './BodyEditor';

const source = await Bun.file(
  import.meta.dir + '/../../../shared/components/BodyEditor.tsx',
).text();

describe('BodyEditor', () => {
  test('should export BodyEditor component', () => {
    expect(BodyEditor).toBeDefined();
    expect(typeof BodyEditor).toBe('function');
  });

  test('should expose all body modes', () => {
    expect(source).toContain("mode: 'none'");
    expect(source).toContain("mode: 'raw'");
    expect(source).toContain("mode: 'urlencoded'");
    expect(source).toContain("mode: 'file'");
    expect(source).toContain("mode: 'multipart'");
  });

  test('should include raw textarea behavior', () => {
    expect(source).toContain("action: 'select-all'");
    expect(source).toContain('Enter request body...');
    expect(source).toContain('formatRequestBody');
    expect(source).toContain('replaceText');
  });

  test('should embed file browser for file-based body modes', () => {
    expect(source).toContain('FileBrowser');
    expect(source).toContain('onSelectFile');
    expect(source).toContain('setShowBrowser(false)');
    expect(source).toContain('setBrowsingFor(null)');
  });
});
