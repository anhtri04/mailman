import { useState, useEffect } from 'react';
import { useKeyboard } from '@opentui/react';
import { Modal } from './Modal';
import { useTheme } from '../theme/ThemeProvider';
import { getListViewport } from '../utils';

interface ThemeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

const MAX_VISIBLE_THEME_ROWS = 14;

export function ThemeSelector({ isOpen, onClose }: ThemeSelectorProps) {
  const { colors, themes, currentThemeId, setTheme, previewTheme } = useTheme();
  const [selectedId, setSelectedId] = useState(currentThemeId);

  // Preview theme immediately when selection changes
  useEffect(() => {
    if (isOpen) {
      previewTheme(selectedId);
    }
  }, [selectedId, isOpen, previewTheme]);

  const selectedIndex = Math.max(
    0,
    themes.findIndex((theme) => theme.id === selectedId),
  );

  const { visibleStart, visibleItems, aboveCount, belowCount } = getListViewport(themes, {
    selectedIndex,
    maxVisibleRows: MAX_VISIBLE_THEME_ROWS,
  });

  useKeyboard((key) => {
    if (!isOpen) return;
    if (key.name === 'escape') {
      handleCancel();
    } else if (key.ctrl && key.name === 't') {
      return;
    } else if (key.name === 'up') {
      if (selectedIndex > 0) {
        setSelectedId(themes[selectedIndex - 1]!.id);
      }
    } else if (key.name === 'down') {
      if (selectedIndex < themes.length - 1) {
        setSelectedId(themes[selectedIndex + 1]!.id);
      }
    } else if (key.name === 'return' || key.name === 'enter') {
        handleSave();
    }
  });

  const handleSave = () => {
    void (async () => {
      await setTheme(selectedId);
    })();
    onClose();
  };

  const handleCancel = () => {
    previewTheme(currentThemeId);
    setSelectedId(currentThemeId);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Select Theme"
      subtitle={`${themes.length} themes`}
    >
      <box
        style={{
          flexDirection: 'column',
          height: '100%',
          backgroundColor: colors.bg.panel,
        }}
      >
        {/* Theme list */}
        <scrollbox style={{ flexGrow: 1 }}>
          {aboveCount > 0 && <text fg={colors.text.dim}>... {aboveCount} more above</text>}
          {visibleItems.map((theme, offset) => {
            const globalIndex = visibleStart + offset;
            const isSelected = globalIndex === selectedIndex;
            return (
              <box
                key={theme.id}
                style={{
                  flexDirection: 'row',
                  paddingLeft: 1,
                  paddingRight: 1,
                  paddingTop: 0,
                  paddingBottom: 0,
                  backgroundColor: isSelected ? colors.bg.selection : 'transparent',
                }}
                onMouseDown={() => setSelectedId(theme.id)}
              >
                <text
                  fg={isSelected ? colors.accent.text : colors.text.primary}
                  bg={isSelected ? colors.bg.selection : undefined}
                >
                  {isSelected ? '► ' : '  '}
                  {theme.name}
                </text>
              </box>
            );
          })}
          {belowCount > 0 && <text fg={colors.text.dim}>... {belowCount} more below</text>}
        </scrollbox>

        {/* Buttons */}
        <box
          style={{
            flexDirection: 'row',
            gap: 1,
            marginTop: 1,
            justifyContent: 'flex-end',
          }}
        >
          <box
            style={{
              border: true,
              borderColor: colors.accent.primary,
              borderStyle: 'rounded',
              paddingLeft: 2,
              paddingRight: 2,
              paddingTop: 0.5,
              paddingBottom: 0.5,
            }}
            onMouseDown={handleSave}
          >
            <text fg={colors.accent.primary}>Save</text>
          </box>
          <box
            style={{
              border: true,
              borderColor: colors.border.default,
              borderStyle: 'rounded',
              paddingLeft: 2,
              paddingRight: 2,
              paddingTop: 0.5,
              paddingBottom: 0.5,
            }}
            onMouseDown={handleCancel}
          >
            <text fg={colors.text.muted}>Cancel</text>
          </box>
        </box>
      </box>
    </Modal>
  );
}
