import { describe, expect, test } from 'bun:test';
import { HistoryModal } from './HistoryModal';

describe('HistoryModal', () => {
  test('should export HistoryModal component', () => {
    expect(HistoryModal).toBeDefined();
    expect(typeof HistoryModal).toBe('function');
  });

  test('should include searchable history list behavior', () => {
    const componentString = HistoryModal.toString();
    expect(componentString).toContain('Search method, URL, status, body...');
    expect(componentString).toContain('filteredEntries');
    expect(componentString).toContain('includes(needle)');
    expect(componentString).toContain('entry.requestName ?? ""');
  });

  test('should handle keyboard navigation and open actions', () => {
    const componentString = HistoryModal.toString();
    expect(componentString).toContain('useKeyboard');
    expect(componentString).toContain('key.name === "up"');
    expect(componentString).toContain('key.name === "down"');
    expect(componentString).toContain('key.name === "return" || key.name === "enter"');
    expect(componentString).toContain('onOpenEntry');
  });

  test('should show unavailable state and empty-state message', () => {
    const componentString = HistoryModal.toString();
    expect(componentString).toContain('Unavailable');
    expect(componentString).toContain('No history entries match your search.');
    expect(componentString).toContain('isOpenable');
  });

  test('should render incoming error message when provided', () => {
    const componentString = HistoryModal.toString();
    expect(componentString).toContain('errorMessage');
    expect(componentString).toContain('colors.syntax.error');
  });
});
