import { useState } from 'react';
import type { KeyBinding } from '@opentui/core';
import { useTheme } from '../../../shared/theme/ThemeProvider';
import {
  addCollection,
  importCollectionsFromFile,
  loadCollections,
  saveCollections,
} from '../../../core/services';
import type { Collection } from '../../../core/types';
import { FileBrowser } from './FileBrowser';
import { Modal } from './Modal';

interface CollectionImportViewProps {
  isOpen: boolean;
  onClose: () => void;
  onCollectionsChange: (collections: Collection[]) => void;
}

export function CollectionImportView({
  isOpen,
  onClose,
  onCollectionsChange,
}: CollectionImportViewProps) {
  const { colors } = useTheme();
  const selectAllBindings: KeyBinding[] = [{ name: 'a', ctrl: true, action: 'select-all' }];
  const [mode, setMode] = useState<'new' | 'import'>('new');
  const [importError, setImportError] = useState<string | null>(null);
  const [newCollectionName, setNewCollectionName] = useState('');

  const handleClose = () => {
    setImportError(null);
    setNewCollectionName('');
    onClose();
  };

  const handleCreateCollection = () => {
    if (!newCollectionName.trim()) return;

    void (async () => {
      await addCollection(newCollectionName.trim());
      const updated = await loadCollections();
      onCollectionsChange(updated);
    })();

    handleClose();
  };

  const handleImportFile = (path: string) => {
    void (async () => {
      try {
        const imported = await importCollectionsFromFile(path);
        if (!imported.length) throw new Error('No collections found');

        const existing = await loadCollections();
        await saveCollections([...existing, ...imported]);
        const updated = await loadCollections();
        onCollectionsChange(updated);
        handleClose();
      } catch (e) {
        setImportError(e instanceof Error ? e.message : String(e));
      }
    })();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Collection">
      <box style={{ flexDirection: 'column', gap: 1, padding: 1, height: '100%' }}>
        <box style={{ flexDirection: 'row', gap: 1 }}>
          <box
            style={{
              border: true,
              borderColor: mode === 'new' ? colors.accent.primary : colors.border.default,
              paddingLeft: 2,
              paddingRight: 2,
            }}
            onMouseDown={() => setMode('new')}
          >
            <text
              fg={mode === 'new' ? colors.accent.primary : colors.text.muted}
              style={{ paddingTop: 0.5, paddingBottom: 0.5 }}
            >
              New
            </text>
          </box>
          <box
            style={{
              border: true,
              borderColor: mode === 'import' ? colors.accent.primary : colors.border.default,
              paddingLeft: 2,
              paddingRight: 2,
            }}
            onMouseDown={() => setMode('import')}
          >
            <text
              fg={mode === 'import' ? colors.accent.primary : colors.text.muted}
              style={{ paddingTop: 0.5, paddingBottom: 0.5 }}
            >
              Import
            </text>
          </box>
        </box>

        {mode === 'new' ? (
          <box style={{ flexDirection: 'column', gap: 1 }}>
            <box
              style={{
                border: true,
                borderColor: colors.border.default,
                borderStyle: 'rounded',
                paddingLeft: 1,
              }}
            >
              <input
                placeholder="Collection name..."
                value={newCollectionName}
                onInput={(val: string) => setNewCollectionName(val)}
                focused={true}
                keyBindings={selectAllBindings}
              />
            </box>
            <box style={{ flexDirection: 'row', gap: 1, marginTop: 1 }}>
              <box
                style={{
                  border: true,
                  borderColor: colors.accent.primary,
                  borderStyle: 'rounded',
                  paddingLeft: 2,
                  paddingRight: 2,
                }}
                onMouseDown={handleCreateCollection}
              >
                <text fg={colors.accent.primary}>Create</text>
              </box>
              <box
                style={{
                  border: true,
                  borderColor: colors.border.default,
                  borderStyle: 'rounded',
                  paddingLeft: 2,
                  paddingRight: 2,
                }}
                onMouseDown={handleClose}
              >
                <text fg={colors.text.muted}>Cancel</text>
              </box>
            </box>
          </box>
        ) : (
          <FileBrowser
            startPath="~"
            fileFilter={(item) => item.isDirectory || item.name.endsWith('.json')}
            onSelectFile={handleImportFile}
            onCancel={handleClose}
          />
        )}
        {importError && <text fg={colors.syntax.error}>{importError}</text>}
      </box>
    </Modal>
  );
}
