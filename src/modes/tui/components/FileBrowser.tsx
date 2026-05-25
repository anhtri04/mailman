import { useState, useCallback } from 'react';
import { useKeyboard } from '@opentui/react';
import { join } from 'path';
import { homedir } from 'os';
import { useDirectory } from '../hooks/useDirectory';
import type { DirItem } from '../hooks/useDirectory';
import { useTheme } from '../../../shared/theme/ThemeProvider';
import { getListViewport } from '../../../shared/utils';

interface FileBrowserProps {
  startPath: string;
  onSelectFile: (path: string) => void;
  onCancel: () => void;
  fileFilter?: (item: DirItem) => boolean;
}

const MAX_VISIBLE_ROWS = 14;

export function FileBrowser({ startPath, onSelectFile, onCancel, fileFilter }: FileBrowserProps) {
  const { colors } = useTheme();
  const { currentPath, items, loading, error, setCurrentPath, goUp } = useDirectory(
    startPath,
    fileFilter,
  );
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleSelect = useCallback(
    (index: number) => {
      const item = items[index];
      if (!item) return;
      if (item.isDirectory) {
        setCurrentPath(join(currentPath, item.name));
        setSelectedIndex(0);
      } else {
        onSelectFile(join(currentPath, item.name));
      }
    },
    [items, currentPath, setCurrentPath, onSelectFile],
  );

  useKeyboard((key) => {
    if (key.name === 'escape') {
      onCancel();
      return;
    }
    if (key.name === 'up') {
      setSelectedIndex((p) => Math.max(0, p - 1));
    } else if (key.name === 'down') {
      setSelectedIndex((p) => (items.length ? Math.min(items.length - 1, p + 1) : 0));
    } else if (key.name === 'return' || key.name === 'enter') {
      handleSelect(selectedIndex);
    } else if (key.name === 'left' || key.name === 'backspace') {
      goUp();
      setSelectedIndex(0);
    }
  });

  // Scroll viewport: keep selected row visible
  const { visibleStart, visibleItems, aboveCount, belowCount } = getListViewport(items, {
    selectedIndex,
    maxVisibleRows: MAX_VISIBLE_ROWS,
  });

  const displayPath = currentPath.startsWith(homedir())
    ? '~' + currentPath.slice(homedir().length)
    : currentPath;

  return (
    <box style={{ flexDirection: 'column', height: '100%', gap: 1 }}>
      <text fg={colors.text.muted}>{displayPath}</text>

      {loading && <text fg={colors.text.dim}>Loading...</text>}

      {error && <text fg={colors.syntax.error}>{error}</text>}

      {!loading && !error && (
        <scrollbox style={{ flexGrow: 1 }}>
          {aboveCount > 0 && <text fg={colors.text.dim}>... {aboveCount} more above</text>}
          {visibleItems.map((item, offset) => {
            const globalIdx = visibleStart + offset;
            const isSelected = globalIdx === selectedIndex;
            return (
              <box
                key={item.name}
                style={{
                  flexDirection: 'row',
                  paddingLeft: 1,
                  backgroundColor: isSelected ? colors.bg.focusHighlight : 'transparent',
                }}
                onMouseDown={() => {
                  setSelectedIndex(globalIdx);
                  handleSelect(globalIdx);
                }}
              >
                <text fg={colors.text.muted}>{item.isDirectory ? '[DIR] ' : '      '}</text>
                <text
                  fg={isSelected ? colors.accent.text : colors.text.primary}
                  bg={isSelected ? colors.bg.focusHighlight : 'transparent'}
                >
                  {item.name}
                  {item.isDirectory ? '/' : ''}
                </text>
              </box>
            );
          })}
          {items.length === 0 && !loading && !error && (
            <text fg={colors.text.dim}>Empty directory</text>
          )}
          {belowCount > 0 && <text fg={colors.text.dim}>... {belowCount} more below</text>}
        </scrollbox>
      )}

      <text fg={colors.text.muted}>
        Navigate: ↑↓ Open/Select: Enter Up: ←/Backspace Cancel: Esc
      </text>
    </box>
  );
}
