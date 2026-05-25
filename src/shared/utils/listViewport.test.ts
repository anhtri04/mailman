import { describe, expect, test } from 'bun:test';
import { getListViewport } from './listViewport';

describe('getListViewport', () => {
  test('keeps selected item centered when possible', () => {
    const viewport = getListViewport([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], {
      selectedIndex: 6,
      maxVisibleRows: 5,
    });

    expect(viewport.visibleStart).toBe(4);
    expect(viewport.visibleEnd).toBe(9);
    expect(viewport.visibleItems).toEqual([4, 5, 6, 7, 8]);
    expect(viewport.selectedVisibleIndex).toBe(2);
  });

  test('clamps viewport near list edges', () => {
    const viewport = getListViewport([0, 1, 2, 3], {
      selectedIndex: 10,
      maxVisibleRows: 3,
    });

    expect(viewport.selectedIndex).toBe(3);
    expect(viewport.visibleStart).toBe(1);
    expect(viewport.visibleEnd).toBe(4);
    expect(viewport.aboveCount).toBe(1);
    expect(viewport.belowCount).toBe(0);
  });

  test('handles empty lists', () => {
    const viewport = getListViewport([], {
      selectedIndex: 5,
      maxVisibleRows: 10,
    });

    expect(viewport.visibleItems).toEqual([]);
    expect(viewport.visibleStart).toBe(0);
    expect(viewport.visibleEnd).toBe(0);
  });
});
