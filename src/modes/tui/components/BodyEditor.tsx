import { useCallback, useRef, useState } from 'react';
import type { KeyBinding, TextareaRenderable } from '@opentui/core';
import { useKeyboard } from '@opentui/react';
import { useTheme } from '../../../shared/theme/ThemeProvider';
import { formatRequestBody } from '../../../shared/utils/request-formatter';

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
  const contentType = detectedContentType ?? detectContentType(body);
  const charCount = body.length;
  const textareaRef = useRef<TextareaRenderable>(null);
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [formatStatus, setFormatStatus] = useState<string | null>(null);
  const selectAllBindings: KeyBinding[] = [{ name: 'a', ctrl: true, action: 'select-all' }];

  const showFormatStatus = useCallback((status: string) => {
    setFormatStatus(status);
    if (statusTimerRef.current) {
      clearTimeout(statusTimerRef.current);
    }
    statusTimerRef.current = setTimeout(() => setFormatStatus(null), 1500);
  }, []);

  useKeyboard((key) => {
    if (!focused || !(key.ctrl && key.name === 'f')) return;
    key.preventDefault();
    key.stopPropagation();

    const currentBody = textareaRef.current?.plainText ?? body;
    const result = formatRequestBody(currentBody, contentType);
    if (result.error) {
      showFormatStatus(result.error);
      return;
    }

    if (!result.changed) {
      showFormatStatus('Already formatted');
      return;
    }

    textareaRef.current?.replaceText(result.value);
    onBodyChange(result.value);
    showFormatStatus('Formatted ✓');
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
        <text fg={colors.text.muted}>
          {contentType}
          {formatStatus ? `  ${formatStatus}` : ''}
        </text>
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
