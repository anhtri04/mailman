import { useCallback, useRef, useState } from 'react';
import type { KeyBinding, TextareaRenderable } from '@opentui/core';
import { useKeyboard } from '@opentui/react';
import type {
  FileRequestBody,
  MultipartField,
  MultipartRequestBody,
  RawRequestBody,
  RequestBody,
  RequestBodyMode,
  UrlEncodedField,
  UrlEncodedRequestBody,
} from '../../../core/types';
import { useTheme } from '../../../shared/theme/ThemeProvider';
import { formatRequestBody } from '../../../shared/utils/request-formatter';
import { useTextareaSyntaxHighlight } from '../hooks/useTextareaSyntaxHighlight';
import type { TextareaHighlightLanguage } from '../utils/textarea-highlighting';
import { FileBrowser } from './FileBrowser';

interface BodyEditorProps {
  body: RequestBody;
  onBodyChange: (body: RequestBody) => void;
  focused: boolean;
}

type FieldPatch<T> = Partial<T>;

const BODY_MODES: Array<{ mode: RequestBodyMode; label: string }> = [
  { mode: 'none', label: 'None' },
  { mode: 'raw', label: 'Raw' },
  { mode: 'urlencoded', label: 'Form' },
  { mode: 'file', label: 'File' },
  { mode: 'multipart', label: 'Multipart' },
];

function newBodyForMode(mode: RequestBodyMode): RequestBody {
  switch (mode) {
    case 'none':
      return { mode: 'none' };
    case 'raw':
      return { mode: 'raw', content: '' };
    case 'urlencoded':
      return { mode: 'urlencoded', fields: [] };
    case 'file':
      return { mode: 'file', filePath: '' };
    case 'multipart':
      return { mode: 'multipart', fields: [] };
  }
}

function detectHighlightLanguage(content: string): TextareaHighlightLanguage {
  const trimmed = content.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'json';
  if (trimmed.startsWith('<!doctype html') || trimmed.startsWith('<html')) return 'html';
  if (trimmed.startsWith('<')) return 'xml';
  return 'text';
}

function iconButton(label: string, onPress: () => void, color: string, borderColor: string) {
  return (
    <box
      style={{
        border: true,
        borderColor,
        borderStyle: 'rounded',
        paddingLeft: 1,
        paddingRight: 1,
      }}
      onMouseDown={onPress}
    >
      <text fg={color}>{label}</text>
    </box>
  );
}

function RawBodyEditor({
  body,
  onBodyChange,
  focused,
}: {
  body: RawRequestBody;
  onBodyChange: (body: RequestBody) => void;
  focused: boolean;
}) {
  const { colors } = useTheme();
  const highlightLanguage = detectHighlightLanguage(body.content);
  const textareaRef = useRef<TextareaRenderable>(null);
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [formatStatus, setFormatStatus] = useState<string | null>(null);
  const selectAllBindings: KeyBinding[] = [{ name: 'a', ctrl: true, action: 'select-all' }];

  useTextareaSyntaxHighlight({ ref: textareaRef, text: body.content, language: highlightLanguage });

  const showFormatStatus = useCallback((status: string) => {
    setFormatStatus(status);
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    statusTimerRef.current = setTimeout(() => setFormatStatus(null), 1500);
  }, []);

  useKeyboard((key) => {
    if (!focused || !(key.ctrl && key.name === 'f')) return;
    key.preventDefault();
    key.stopPropagation();

    const currentBody = textareaRef.current?.plainText ?? body.content;
    const result = formatRequestBody(currentBody, 'application/json');
    if (result.error) {
      showFormatStatus(result.error);
      return;
    }
    if (!result.changed) {
      showFormatStatus('Already formatted');
      return;
    }

    textareaRef.current?.replaceText(result.value);
    onBodyChange({ ...body, content: result.value });
    showFormatStatus('Formatted ✓');
  });

  const handleContentChange = useCallback(() => {
    if (textareaRef.current) onBodyChange({ ...body, content: textareaRef.current.plainText });
  }, [body, onBodyChange]);

  return (
    <box style={{ flexDirection: 'column', flexGrow: 1 }}>
      <box style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 1 }}>
        <text fg={colors.text.muted}>
          {highlightLanguage}
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
            initialValue={body.content}
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
      <box style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 1 }}>
        <text fg={colors.text.muted}>{body.content.length} chars</text>
      </box>
    </box>
  );
}

function UrlEncodedBodyEditor({
  body,
  onBodyChange,
}: {
  body: UrlEncodedRequestBody;
  onBodyChange: (body: RequestBody) => void;
}) {
  const { colors } = useTheme();

  const updateField = (id: string, patch: FieldPatch<UrlEncodedField>) => {
    onBodyChange({
      ...body,
      fields: body.fields.map((field) => (field.id === id ? { ...field, ...patch } : field)),
    });
  };

  const removeField = (id: string) => {
    onBodyChange({ ...body, fields: body.fields.filter((field) => field.id !== id) });
  };

  const addField = () => {
    onBodyChange({
      ...body,
      fields: [...body.fields, { id: Date.now().toString(), enabled: true, key: '', value: '' }],
    });
  };

  return (
    <box style={{ flexDirection: 'column', gap: 1, flexGrow: 1 }}>
      <box style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <text fg={colors.text.muted}>application/x-www-form-urlencoded</text>
        {iconButton('Add field', addField, colors.accent.primary, colors.accent.primary)}
      </box>
      <scrollbox style={{ flexGrow: 1 }}>
        <box style={{ flexDirection: 'column', gap: 1 }}>
          {body.fields.map((field) => (
            <box key={field.id} style={{ flexDirection: 'row', gap: 1, alignItems: 'center' }}>
              <box onMouseDown={() => updateField(field.id, { enabled: !field.enabled })}>
                <text fg={field.enabled ? colors.accent.primary : colors.text.dim}>
                  {field.enabled ? '[x]' : '[ ]'}
                </text>
              </box>
              <box
                style={{
                  width: 24,
                  border: true,
                  borderColor: colors.border.default,
                  paddingLeft: 1,
                }}
              >
                <input
                  placeholder="key"
                  value={field.key}
                  onInput={(key: string) => updateField(field.id, { key })}
                />
              </box>
              <box
                style={{
                  flexGrow: 1,
                  border: true,
                  borderColor: colors.border.default,
                  paddingLeft: 1,
                }}
              >
                <input
                  placeholder="value"
                  value={field.value}
                  onInput={(value: string) => updateField(field.id, { value })}
                />
              </box>
              {iconButton(
                'Remove',
                () => removeField(field.id),
                colors.syntax.error,
                colors.border.default,
              )}
            </box>
          ))}
          {body.fields.length === 0 && (
            <text fg={colors.text.dim}>No fields. Click Add field.</text>
          )}
        </box>
      </scrollbox>
    </box>
  );
}

function FileBodyEditor({
  body,
  onBodyChange,
}: {
  body: FileRequestBody;
  onBodyChange: (body: RequestBody) => void;
}) {
  const { colors } = useTheme();
  const [showBrowser, setShowBrowser] = useState(false);

  return (
    <box style={{ flexDirection: 'column', gap: 1, flexGrow: 1 }}>
      <box style={{ flexDirection: 'row', gap: 1, alignItems: 'center' }}>
        <text fg={colors.text.muted}>File:</text>
        <text fg={body.filePath ? colors.text.primary : colors.text.dim}>
          {body.filePath || 'No file selected'}
        </text>
        {iconButton(
          'Browse',
          () => setShowBrowser(true),
          colors.accent.primary,
          colors.accent.primary,
        )}
      </box>
      <box style={{ border: true, borderColor: colors.border.default, paddingLeft: 1 }}>
        <input
          placeholder="Content-Type, optional"
          value={body.contentType ?? ''}
          onInput={(contentType: string) => onBodyChange({ ...body, contentType })}
        />
      </box>
      {showBrowser && (
        <box style={{ height: 18, border: true, borderColor: colors.accent.primary, padding: 1 }}>
          <FileBrowser
            startPath="~"
            onSelectFile={(path) => {
              onBodyChange({ ...body, filePath: path });
              setShowBrowser(false);
            }}
            onCancel={() => setShowBrowser(false)}
          />
        </box>
      )}
    </box>
  );
}

function MultipartBodyEditor({
  body,
  onBodyChange,
}: {
  body: MultipartRequestBody;
  onBodyChange: (body: RequestBody) => void;
}) {
  const { colors } = useTheme();
  const [browsingFor, setBrowsingFor] = useState<string | null>(null);

  const updateField = (id: string, patch: Partial<MultipartField>) => {
    onBodyChange({
      ...body,
      fields: body.fields.map((field) =>
        field.id === id ? ({ ...field, ...patch } as MultipartField) : field,
      ),
    });
  };

  const removeField = (id: string) => {
    onBodyChange({ ...body, fields: body.fields.filter((field) => field.id !== id) });
  };

  const addTextField = () => {
    onBodyChange({
      ...body,
      fields: [
        ...body.fields,
        { id: Date.now().toString(), enabled: true, kind: 'text', name: '', value: '' },
      ],
    });
  };

  const addFileField = () => {
    onBodyChange({
      ...body,
      fields: [
        ...body.fields,
        { id: Date.now().toString(), enabled: true, kind: 'file', name: '', filePath: '' },
      ],
    });
  };

  return (
    <box style={{ flexDirection: 'column', gap: 1, flexGrow: 1 }}>
      <box style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <text fg={colors.text.muted}>multipart/form-data</text>
        <box style={{ flexDirection: 'row', gap: 1 }}>
          {iconButton('Add text', addTextField, colors.accent.primary, colors.accent.primary)}
          {iconButton('Add file', addFileField, colors.accent.primary, colors.accent.primary)}
        </box>
      </box>
      <scrollbox style={{ flexGrow: 1 }}>
        <box style={{ flexDirection: 'column', gap: 1 }}>
          {body.fields.map((field) => (
            <box key={field.id} style={{ flexDirection: 'row', gap: 1, alignItems: 'center' }}>
              <box onMouseDown={() => updateField(field.id, { enabled: !field.enabled })}>
                <text fg={field.enabled ? colors.accent.primary : colors.text.dim}>
                  {field.enabled ? '[x]' : '[ ]'}
                </text>
              </box>
              <text fg={colors.text.muted}>{field.kind === 'file' ? 'File' : 'Text'}</text>
              <box
                style={{
                  width: 20,
                  border: true,
                  borderColor: colors.border.default,
                  paddingLeft: 1,
                }}
              >
                <input
                  placeholder="name"
                  value={field.name}
                  onInput={(name: string) => updateField(field.id, { name })}
                />
              </box>
              {field.kind === 'text' ? (
                <box
                  style={{
                    flexGrow: 1,
                    border: true,
                    borderColor: colors.border.default,
                    paddingLeft: 1,
                  }}
                >
                  <input
                    placeholder="value"
                    value={field.value}
                    onInput={(value: string) => updateField(field.id, { value })}
                  />
                </box>
              ) : (
                <>
                  <text fg={field.filePath ? colors.text.primary : colors.text.dim}>
                    {field.filePath || 'No file selected'}
                  </text>
                  {iconButton(
                    'Browse',
                    () => setBrowsingFor(field.id),
                    colors.accent.primary,
                    colors.border.default,
                  )}
                </>
              )}
              {iconButton(
                'Remove',
                () => removeField(field.id),
                colors.syntax.error,
                colors.border.default,
              )}
            </box>
          ))}
          {body.fields.length === 0 && (
            <text fg={colors.text.dim}>No fields. Add text or file fields.</text>
          )}
        </box>
      </scrollbox>
      {browsingFor && (
        <box style={{ height: 18, border: true, borderColor: colors.accent.primary, padding: 1 }}>
          <FileBrowser
            startPath="~"
            onSelectFile={(path) => {
              updateField(browsingFor, { filePath: path });
              setBrowsingFor(null);
            }}
            onCancel={() => setBrowsingFor(null)}
          />
        </box>
      )}
    </box>
  );
}

export function BodyEditor({ body, onBodyChange, focused }: BodyEditorProps) {
  const { colors } = useTheme();

  const renderModeButton = (mode: RequestBodyMode, label: string) => {
    const active = body.mode === mode;
    return (
      <box
        key={mode}
        style={{
          border: true,
          borderColor: active ? colors.accent.primary : colors.border.default,
          borderStyle: 'rounded',
          paddingLeft: 2,
          paddingRight: 2,
        }}
        onMouseDown={() => onBodyChange(newBodyForMode(mode))}
      >
        <text fg={active ? colors.accent.primary : colors.text.muted}>
          {active ? <strong>{label}</strong> : label}
        </text>
      </box>
    );
  };

  return (
    <box style={{ flexDirection: 'column', padding: 1, flexGrow: 1, height: '100%' }}>
      <box style={{ flexDirection: 'row', gap: 1 }}>
        {BODY_MODES.map(({ mode, label }) => renderModeButton(mode, label))}
      </box>

      <box style={{ flexGrow: 1, marginTop: 1 }}>
        {body.mode === 'none' && <text fg={colors.text.muted}>No request body will be sent.</text>}
        {body.mode === 'raw' && (
          <RawBodyEditor body={body} onBodyChange={onBodyChange} focused={focused} />
        )}
        {body.mode === 'urlencoded' && (
          <UrlEncodedBodyEditor body={body} onBodyChange={onBodyChange} />
        )}
        {body.mode === 'file' && <FileBodyEditor body={body} onBodyChange={onBodyChange} />}
        {body.mode === 'multipart' && (
          <MultipartBodyEditor body={body} onBodyChange={onBodyChange} />
        )}
      </box>
    </box>
  );
}
