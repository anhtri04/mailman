import { useEffect, useMemo, useState } from 'react';
import { useKeyboard } from '@opentui/react';
import { summarizeRequestBody } from '../../core/services';
import type { HistoryEntry } from '../../types';
import { useTheme } from '../theme/ThemeProvider';
import { getListViewport } from '../utils';

interface HistoryModalProps {
  entries: HistoryEntry[];
  onOpenEntry: (entry: HistoryEntry) => void;
  errorMessage: string | null;
  allowSnapshotOpen?: boolean;
}

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

const MAX_VISIBLE_HISTORY_ENTRIES = 5;

export function HistoryModal({
  entries,
  onOpenEntry,
  errorMessage,
  allowSnapshotOpen = false,
}: HistoryModalProps) {
  const { colors } = useTheme();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredEntries = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return entries;
    return entries.filter((entry) => {
      const haystack = [
        entry.request.method,
        entry.request.url,
        entry.requestName ?? '',
        String(entry.response.status),
        entry.response.statusText,
        entry.response.body,
        entry.request.body ? summarizeRequestBody(entry.request.body) : '',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [entries, search]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search, entries]);

  const {
    selectedIndex: viewportSelectedIndex,
    visibleStart,
    visibleItems: visibleEntries,
    aboveCount,
    belowCount,
  } = getListViewport(filteredEntries, {
    selectedIndex,
    maxVisibleRows: MAX_VISIBLE_HISTORY_ENTRIES,
  });

  useKeyboard((key) => {
    if (key.name === 'up') {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
      return;
    }
    if (key.name === 'down') {
      setSelectedIndex((prev) =>
        filteredEntries.length ? Math.min(filteredEntries.length - 1, prev + 1) : 0,
      );
      return;
    }
    if ((key.name === 'return' || key.name === 'enter') && filteredEntries[viewportSelectedIndex]) {
      onOpenEntry(filteredEntries[viewportSelectedIndex]!);
    }
  });

  return (
    <box style={{ flexDirection: 'column', height: '100%', gap: 1 }}>
      <box
        style={{
          border: true,
          borderColor: colors.border.default,
          borderStyle: 'rounded',
          paddingLeft: 1,
          paddingRight: 1,
          paddingTop: 0.5,
          paddingBottom: 0.5,
        }}
      >
        <input
          placeholder="Search method, URL, status, body..."
          value={search}
          onInput={(val: string) => setSearch(val)}
          focused={true}
        />
      </box>

      <box style={{ flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
        <scrollbox style={{ flexGrow: 1 }}>
          <box style={{ flexDirection: 'column' }}>
            {aboveCount > 0 && <text fg={colors.text.dim}>... {aboveCount} more above</text>}
            {visibleEntries.map((entry, offset) => {
              const index = visibleStart + offset;
              const isSelected = index === viewportSelectedIndex;
              const isOpenable =
                allowSnapshotOpen || Boolean(entry.collectionId && entry.requestId);
              return (
                <box
                  key={entry.id}
                  style={{
                    flexDirection: 'column',
                    border: true,
                    borderColor: isSelected ? colors.accent.primary : colors.border.default,
                    borderStyle: 'rounded',
                    paddingLeft: 1,
                    paddingRight: 1,
                    marginBottom: 1,
                    backgroundColor: isSelected ? colors.bg.focusHighlight : 'transparent',
                  }}
                  onMouseDown={() => {
                    setSelectedIndex(index);
                    if (isOpenable) {
                      onOpenEntry(entry);
                    }
                  }}
                >
                  <box style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <text fg={colors.text.primary}>
                      <strong>{entry.request.method}</strong> {entry.request.url}
                    </text>
                    <text fg={colors.text.muted}>{formatTimestamp(entry.timestamp)}</text>
                  </box>
                  <box style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <text
                      fg={
                        entry.response.status >= 400 ? colors.syntax.error : colors.syntax.success
                      }
                    >
                      {entry.response.status} {entry.response.statusText}
                    </text>
                    <text fg={isOpenable ? colors.accent.primary : colors.text.muted}>
                      {isOpenable
                        ? allowSnapshotOpen
                          ? 'Enter/Click to view'
                          : 'Enter/Click to load'
                        : 'Unavailable'}
                    </text>
                  </box>
                </box>
              );
            })}
            {filteredEntries.length === 0 && (
              <text fg={colors.text.muted}>No history entries match your search.</text>
            )}
            {belowCount > 0 && <text fg={colors.text.dim}>... {belowCount} more below</text>}
          </box>
        </scrollbox>
      </box>

      {errorMessage && <text fg={colors.syntax.error}>{errorMessage}</text>}
    </box>
  );
}
