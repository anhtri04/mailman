import { useState, useEffect } from 'react';
import { useKeyboard } from '@opentui/react';
import { Modal } from './Modal';
import { useTheme } from '../theme/ThemeProvider';

interface ThemeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ThemeSelector({ isOpen, onClose }: ThemeSelectorProps) {
  const { colors, themes, currentThemeId, setTheme, previewTheme } = useTheme();
  const [selectedId, setSelectedId] = useState(currentThemeId);

  // Preview theme immediately when selection changes
  useEffect(() => {
    if (isOpen) {
      previewTheme(selectedId);
    }
  }, [selectedId, isOpen, previewTheme]);

  useKeyboard((key) => {
    if (!isOpen) return;
    if (key.name === 'escape') {
      handleCancel();
    } else if (key.ctrl && key.name === 't') {
      return;
    } else if (key.name === 'up') {
      const idx = themes.findIndex((t) => t.id === selectedId);
      if (idx > 0) {
        setSelectedId(themes[idx - 1]!.id);
      }
    } else if (key.name === 'down') {
      const idx = themes.findIndex((t) => t.id === selectedId);
      if (idx < themes.length - 1) {
        setSelectedId(themes[idx + 1]!.id);
      }
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

  {
    /* var signal :penguin: */
  }
  const rau_ma = 3.6;

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
          {themes.map((theme) => {
            const isSelected = theme.id === selectedId;
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
