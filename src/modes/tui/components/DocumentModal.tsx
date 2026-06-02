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
        spell: { fg: RGBA.fromHex(colors.text.primary) },
        conceal: { fg: RGBA.fromHex(colors.text.dim) },
        markup: { fg: RGBA.fromHex(colors.text.primary) },
        'markup.heading': { fg: RGBA.fromHex(colors.accent.primary), bold: true },
        'markup.heading.1': { fg: RGBA.fromHex(colors.accent.primary), bold: true },
        'markup.heading.2': { fg: RGBA.fromHex(colors.accent.primary), bold: true },
        'markup.heading.3': { fg: RGBA.fromHex(colors.accent.primary), bold: true },
        'markup.heading.4': { fg: RGBA.fromHex(colors.accent.primary), bold: true },
        'markup.heading.5': { fg: RGBA.fromHex(colors.accent.primary), bold: true },
        'markup.heading.6': { fg: RGBA.fromHex(colors.accent.primary), bold: true },
        'markup.link': { fg: RGBA.fromHex(colors.accent.primary), underline: true },
        'markup.link.label': { fg: RGBA.fromHex(colors.accent.primary) },
        'markup.link.url': { fg: RGBA.fromHex(colors.text.muted), underline: true },
        'markup.raw': { fg: RGBA.fromHex(colors.syntax.success) },
        'markup.raw.block': {
          fg: RGBA.fromHex(colors.text.primary),
          bg: RGBA.fromHex(colors.bg.deep),
        },
        label: { fg: RGBA.fromHex(colors.text.muted) },
        keyword: { fg: RGBA.fromHex(colors.syntax.info), bold: true },
        variable: { fg: RGBA.fromHex(colors.text.primary) },
        type: { fg: RGBA.fromHex(colors.syntax.warning) },
        constant: { fg: RGBA.fromHex(colors.syntax.warning) },
        string: { fg: RGBA.fromHex(colors.syntax.success) },
        number: { fg: RGBA.fromHex(colors.syntax.success) },
        operator: { fg: RGBA.fromHex(colors.syntax.punctuation) },
        punctuation: { fg: RGBA.fromHex(colors.syntax.punctuation) },
        'punctuation.special': { fg: RGBA.fromHex(colors.syntax.punctuation) },
        'punctuation.delimiter': { fg: RGBA.fromHex(colors.syntax.punctuation) },
        'markup.italic': { fg: RGBA.fromHex(colors.text.primary), italic: true },
        'markup.strong': { fg: RGBA.fromHex(colors.text.primary), bold: true },
        'markup.strikethrough': { fg: RGBA.fromHex(colors.text.muted), dim: true },
        'markup.list': { fg: RGBA.fromHex(colors.accent.primary) },
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
