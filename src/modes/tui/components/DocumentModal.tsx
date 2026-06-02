import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RGBA, SyntaxStyle } from '@opentui/core';
import type { KeyBinding, TextareaRenderable } from '@opentui/core';
import { useKeyboard } from '@opentui/react';
import { useTheme } from '../../../shared/theme/ThemeProvider';
import { Modal } from './Modal';

type DocumentTab = 'preview' | 'markdown';

interface DocumentModalProps {
  requestName: string;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
}

const DOCUMENT_TABS: DocumentTab[] = ['preview', 'markdown'];

export function DocumentModal({ requestName, value, onChange, onClose }: DocumentModalProps) {
  const { colors } = useTheme();
  const syntaxStyle = useMemo(
    () =>
      SyntaxStyle.fromStyles({
        default: { fg: RGBA.fromHex(colors.text.primary) },
        'markdown-text': { fg: RGBA.fromHex(colors.text.primary) },
        'markdown-heading': { fg: RGBA.fromHex(colors.accent.primary), bold: true },
        'markdown-link': { fg: RGBA.fromHex(colors.accent.primary), underline: true },
        'markdown-link-text': { fg: RGBA.fromHex(colors.accent.primary) },
        'markdown-code': { fg: RGBA.fromHex(colors.syntax.success) },
        'markdown-code-block': { fg: RGBA.fromHex(colors.text.primary) },
        'markdown-block-quote': { fg: RGBA.fromHex(colors.text.muted), italic: true },
        'markdown-emph': { fg: RGBA.fromHex(colors.text.primary), italic: true },
        'markdown-strong': { fg: RGBA.fromHex(colors.text.primary), bold: true },
        'markdown-horizontal-rule': { fg: RGBA.fromHex(colors.border.default) },
        'markdown-list-item': { fg: RGBA.fromHex(colors.accent.primary) },
        'markdown-list-enumeration': { fg: RGBA.fromHex(colors.accent.primary) },
        'markdown-image': { fg: RGBA.fromHex(colors.accent.primary) },
        'markdown-image-text': { fg: RGBA.fromHex(colors.text.muted) },
      }),
    [colors],
  );
  const textareaRef = useRef<TextareaRenderable>(null);
  const [activeTab, setActiveTab] = useState<DocumentTab>('preview');
  const selectAllBindings: KeyBinding[] = [{ name: 'a', ctrl: true, action: 'select-all' }];

  useEffect(() => {
    return () => syntaxStyle.destroy();
  }, [syntaxStyle]);

  useKeyboard((key) => {
    if (key.name !== 'tab') return;

    const currentIndex = DOCUMENT_TABS.indexOf(activeTab);
    const nextTab = DOCUMENT_TABS[(currentIndex + 1) % DOCUMENT_TABS.length];
    if (nextTab) setActiveTab(nextTab);
  });

  const handleContentChange = useCallback(() => {
    if (textareaRef.current) onChange(textareaRef.current.plainText);
  }, [onChange]);

  const renderTabButton = useCallback(
    (tab: DocumentTab, label: string) => {
      const isActive = activeTab === tab;
      return (
        <box
          style={{
            paddingLeft: 2,
            paddingRight: 2,
            border: true,
            borderColor: isActive ? colors.accent.primary : colors.border.default,
          }}
          onMouseDown={(event: { stopPropagation: () => void }) => {
            event.stopPropagation();
            setActiveTab(tab);
          }}
        >
          <text fg={isActive ? colors.accent.primary : colors.text.muted}>
            {isActive ? <strong>{label}</strong> : label}
          </text>
        </box>
      );
    },
    [activeTab, colors],
  );

  return (
    <Modal isOpen={true} onClose={onClose} title="Document" subtitle={requestName}>
      <box style={{ flexDirection: 'column', flexGrow: 1, flexShrink: 1, minHeight: 0 }}>
        <box style={{ flexDirection: 'row', gap: 1, marginBottom: 1, flexShrink: 0 }}>
          {renderTabButton('preview', 'Preview')}
          {renderTabButton('markdown', 'Markdown')}
          <text fg={colors.text.muted} style={{ marginLeft: 2 }}>
            Tab Switch tabs · Ctrl+S Save
          </text>
        </box>

        {activeTab === 'preview' ? (
          <scrollbox style={{ flexGrow: 1, flexShrink: 1, minHeight: 0 }}>
            <box style={{ flexDirection: 'column', paddingRight: 1 }}>
              <markdown
                content={value.trim() ? value : '_No document yet._'}
                syntaxStyle={syntaxStyle}
              />
            </box>
          </scrollbox>
        ) : (
          <box
            style={{
              flexGrow: 1,
              flexShrink: 1,
              minHeight: 0,
              border: true,
              borderColor: colors.accent.primary,
              backgroundColor: colors.bg.panel,
            }}
          >
            <scrollbox style={{ flexGrow: 1, flexShrink: 1, minHeight: 0 }}>
              <textarea
                ref={textareaRef}
                initialValue={value}
                placeholder="Write request documentation in Markdown..."
                focused={true}
                onContentChange={handleContentChange}
                keyBindings={selectAllBindings}
                backgroundColor={colors.bg.panel}
                textColor={colors.text.primary}
                placeholderColor={colors.text.dim}
              />
            </scrollbox>
          </box>
        )}
      </box>
    </Modal>
  );
}
