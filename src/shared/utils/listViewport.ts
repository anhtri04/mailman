export interface ListViewport<T> {
  selectedIndex: number;
  visibleStart: number;
  visibleEnd: number;
  visibleItems: readonly T[];
  aboveCount: number;
  belowCount: number;
  selectedVisibleIndex: number;
}

export interface ListViewportOptions {
  selectedIndex: number;
  maxVisibleRows: number;
  preferredOffset?: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

export function getListViewport<T>(
  items: readonly T[],
  options: ListViewportOptions,
): ListViewport<T> {
  const itemCount = items.length;
  const maxVisibleRows = Math.max(0, Math.floor(options.maxVisibleRows));

  if (itemCount === 0 || maxVisibleRows === 0) {
    return {
      selectedIndex: 0,
      visibleStart: 0,
      visibleEnd: 0,
      visibleItems: [],
      aboveCount: 0,
      belowCount: 0,
      selectedVisibleIndex: 0,
    };
  }

  const selectedIndex = clamp(options.selectedIndex, 0, itemCount - 1);
  const maxVisibleItems = Math.min(maxVisibleRows, itemCount);
  const maxStart = Math.max(0, itemCount - maxVisibleItems);
  const preferredOffset = options.preferredOffset ?? Math.floor(maxVisibleItems / 2);
  const safePreferredOffset = clamp(Math.floor(preferredOffset), 0, maxVisibleItems - 1);
  const visibleStart = clamp(selectedIndex - safePreferredOffset, 0, maxStart);
  const visibleEnd = Math.min(itemCount, visibleStart + maxVisibleItems);

  return {
    selectedIndex,
    visibleStart,
    visibleEnd,
    visibleItems: items.slice(visibleStart, visibleEnd),
    aboveCount: visibleStart,
    belowCount: itemCount - visibleEnd,
    selectedVisibleIndex: selectedIndex - visibleStart,
  };
}
