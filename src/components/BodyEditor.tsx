import { useCallback, useRef } from 'react';
import type { KeyBinding, TextareaRenderable } from '@opentui/core';
import { useKeyboard, useRenderer } from '@opentui/react';
import { useTheme } from '../theme/ThemeProvider';

interface BodyEditorProps {
  body: string;
  onBodyChange: (body: string) => void;
  focused: boolean;
  detectedContentType?: string;
}

function detectContentType(body: string): string {
  const trimmed = body.trim();

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return 'application/json';
  }

  if (trimmed.includes('=')) {
    return 'application/x-www-form-urlencoded';
  }

  return 'text/plain';
}

export function BodyEditor({ body, onBodyChange, focused, detectedContentType }: BodyEditorProps) {
  const { colors } = useTheme();
  const borderColor = focused ? colors.accent.primary : colors.border.default;
  const contentType = detectedContentType ?? detectContentType(body);
  const charCount = body.length;
  const textareaRef = useRef<TextareaRenderable>(null);
  const selectAllBindings: KeyBinding[] = [{ name: 'a', ctrl: true, action: 'select-all' }];
  const renderer = useRenderer();

  useKeyboard((key) => {
    if (key.ctrl && key.name === 'c') {
      console.log('[DEBUG] Ctrl+C fired', { focused, hasRef: !!textareaRef.current });
      if (textareaRef.current) {
        const ev = textareaRef.current.editorView;
        const evSel = ev.getSelection();
        const evText = ev.getSelectedText();
        const rbSel = textareaRef.current.getSelectedText();
        const hasSel = textareaRef.current.hasSelection();
        const plainText = textareaRef.current.plainText;
        console.log('[DEBUG] editorView.getSelection():', evSel);
        console.log('[DEBUG] editorView.getSelectedText():', JSON.stringify(evText));
        console.log('[DEBUG] renderable.getSelectedText():', JSON.stringify(rbSel));
        console.log('[DEBUG] renderable.hasSelection():', hasSel);
        console.log('[DEBUG] plainText length:', plainText.length);
        const selection = renderer.getSelection();
        console.log('[DEBUG] renderer.hasSelection:', renderer.hasSelection);
        console.log('[DEBUG] renderer.getSelection():', selection);
        if (selection) {
          console.log(
            '[DEBUG] renderer.getSelection().getSelectedText():',
            JSON.stringify(selection.getSelectedText()),
          );
        }
      }
    }
  });

  const handleContentChange = useCallback(() => {
    if (textareaRef.current) {
      const newText = textareaRef.current.plainText;
      onBodyChange(newText);
    }
  }, [onBodyChange]);

  return (
    <box
      style={{
        flexDirection: 'column',
        // border: true,
        // borderColor,
        padding: 1,
        flexGrow: 1,
        marginTop: 1,
      }}
    >
      <box
        style={{
          flexDirection: 'row',
          justifyContent: 'flex-end',
          alignItems: 'center',
          marginBottom: 1,
        }}
      >
        <text fg={colors.text.muted}>{contentType}</text>
      </box>

      <box
        style={{
          flexGrow: 1,
          border: true,
          borderColor: focused ? colors.accent.primary : colors.border.default,
          backgroundColor: colors.bg.panel,
        }}
      >
        <scrollbox style={{ flexGrow: 1 }}>
          <textarea
            ref={textareaRef}
            initialValue={body}
            placeholder="Enter request body..."
            focused={focused}
            onContentChange={handleContentChange}
            keyBindings={selectAllBindings}
            backgroundColor={colors.bg.panel}
            textColor={colors.text.primary}
            placeholderColor={colors.text.dim}
          />
        </scrollbox>
      </box>

      <box
        style={{
          flexDirection: 'row',
          justifyContent: 'flex-end',
          marginTop: 1,
        }}
      >
        <text fg={colors.text.muted}>{charCount} chars</text>
      </box>
    </box>
  );
}
