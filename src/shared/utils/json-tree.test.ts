import { describe, expect, test } from 'bun:test';
import { appendJsonPath, buildJsonTreeRows, canRenderJsonTree, parseJsonTree } from './json-tree';

describe('json-tree', () => {
  test('parses valid JSON and reports invalid JSON', () => {
    expect(parseJsonTree('{"ok":true}').ok).toBe(true);
    expect(parseJsonTree('{invalid').ok).toBe(false);
  });

  test('builds expanded rows for nested objects and arrays', () => {
    const parsed = parseJsonTree('{"user":{"name":"Ada","tags":["admin","dev"]}}');
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const rows = buildJsonTreeRows(parsed.value, new Set());
    expect(rows.map((row) => row.path)).toContain('$/user');
    expect(rows.map((row) => row.path)).toContain('$/user/name');
    expect(rows.map((row) => row.path)).toContain('$/user/tags/0');
    expect(rows.some((row) => row.rowType === 'close')).toBe(true);
  });

  test('collapses descendants for collapsed paths', () => {
    const parsed = parseJsonTree('{"user":{"name":"Ada","age":36},"ok":true}');
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const rows = buildJsonTreeRows(parsed.value, new Set(['$/user']));
    const collapsed = rows.find((row) => row.path === '$/user');

    expect(collapsed?.collapsed).toBe(true);
    expect(collapsed?.valueText).toBe('{…} 2 keys');
    expect(rows.some((row) => row.path === '$/user/name')).toBe(false);
    expect(rows.some((row) => row.path === '$/ok')).toBe(true);
  });

  test('renders primitive roots as a single row', () => {
    const parsed = parseJsonTree('"hello"');
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const rows = buildJsonTreeRows(parsed.value, new Set());
    expect(rows).toHaveLength(1);
    expect(rows[0]?.rowType).toBe('primitive');
    expect(rows[0]?.valueText).toBe('"hello"');
  });

  test('escapes JSON path segments', () => {
    expect(appendJsonPath('$', 'a/b~c')).toBe('$/a~1b~0c');
  });

  test('detects renderable JSON tree roots', () => {
    expect(canRenderJsonTree('{"ok":true}')).toBe(true);
    expect(canRenderJsonTree('[1,2,3]')).toBe(true);
    expect(canRenderJsonTree('"hello"')).toBe(false);
    expect(canRenderJsonTree('{invalid')).toBe(false);
  });
});
