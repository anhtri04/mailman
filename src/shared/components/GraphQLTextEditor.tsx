import { useCallback, useRef, useState } from 'react';
import type { KeyBinding, TextareaRenderable } from '@opentui/core';
import { useKeyboard } from '@opentui/react';
import { useTheme } from '../theme/ThemeProvider';
import { formatGraphQLQuery, formatGraphQLVariables } from '../utils/request-formatter';
import { useTextareaSyntaxHighlight } from '../hooks/useTextareaSyntaxHighlight';

interface GraphQLTextEditorProps {
  title: string;
  value: string;
  language: 'graphql' | 'json';
  onChange: (value: string) => void;
  focused?: boolean;
  placeholder?: string;
}

export function GraphQLTextEditor({
  title,
  value,
  language,
  onChange,
  focused = true,
  placeholder,
}: GraphQLTextEditorProps) {
  const { colors } = useTheme();
  const textareaRef = useRef<TextareaRenderable>(null);
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [formatStatus, setFormatStatus] = useState<string | null>(null);
  const selectAllBindings: KeyBinding[] = [{ name: 'a', ctrl: true, action: 'select-all' }];

  useTextareaSyntaxHighlight({ ref: textareaRef, text: value, language });

  const showFormatStatus = useCallback((status: string) => {
    setFormatStatus(status);
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    statusTimerRef.current = setTimeout(() => setFormatStatus(null), 1500);
  }, []);

  const formatValue = useCallback(() => {
    const currentValue = textareaRef.current?.plainText ?? value;
    const result =
      language === 'graphql'
        ? formatGraphQLQuery(currentValue)
        : formatGraphQLVariables(currentValue);

    if (result.error) {
      showFormatStatus(result.error);
      return;
    }

    if (!result.changed) {
      showFormatStatus('Already formatted');
      return;
    }

    textareaRef.current?.replaceText(result.value);
    onChange(result.value);
    showFormatStatus('Formatted ✓');
  }, [language, onChange, showFormatStatus, value]);

  useKeyboard((key) => {
    if (!focused || !(key.ctrl && key.name === 'f')) return;
    key.preventDefault();
    key.stopPropagation();
    formatValue();
  });

  const handleContentChange = useCallback(() => {
    onChange(textareaRef.current?.plainText ?? '');
  }, [onChange]);

  return (
    <box style={{ flexDirection: 'column', flexGrow: 1, height: '100%', minHeight: 0 }}>
      <box style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1 }}>
        <text fg={colors.accent.primary}>
          <strong>{title}</strong>
        </text>
        <text fg={colors.text.muted}>
          {language}
          {formatStatus ? `  ${formatStatus}` : '  Ctrl+F format'}
        </text>
      </box>
      <box
        style={{
          flexGrow: 1,
          minHeight: 0,
          border: true,
          borderColor: focused ? colors.accent.primary : colors.border.default,
          backgroundColor: colors.bg.panel,
        }}
      >
        <scrollbox style={{ flexGrow: 1, minHeight: 0 }}>
          <textarea
            ref={textareaRef}
            initialValue={value}
            placeholder={placeholder ?? `Enter ${title.toLowerCase()}...`}
            focused={focused}
            onContentChange={handleContentChange}
            keyBindings={selectAllBindings}
            backgroundColor={colors.bg.panel}
            textColor={colors.text.primary}
            placeholderColor={colors.text.dim}
          />
        </scrollbox>
      </box>
      <box style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 1 }}>
        <text fg={colors.text.muted}>{value.length} chars</text>
      </box>
    </box>
  );
}
