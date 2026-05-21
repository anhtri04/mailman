import { useCallback, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { KeyBinding, TextareaRenderable } from '@opentui/core';
import { useTheme } from '../../../shared/theme/ThemeProvider';
import type { RequestScripts } from '../../../types';
import { useTextareaSyntaxHighlight } from '../hooks/useTextareaSyntaxHighlight';

type ScriptSection = 'beforeRequest' | 'afterResponse';

interface ScriptsEditorProps {
  protocol: 'rest' | 'graphql';
  scripts: RequestScripts;
  onScriptsChange: (scripts: RequestScripts) => void;
}

interface ScriptSnippet {
  id: string;
  label: string;
  section: ScriptSection;
  code: string;
}

const REST_SNIPPETS: ScriptSnippet[] = [
  {
    id: 'header',
    label: 'Add auth header',
    section: 'beforeRequest',
    code: "request.headers['Authorization'] = 'Bearer token';",
  },
  {
    id: 'timestamp',
    label: 'Add timestamp param',
    section: 'beforeRequest',
    code: "const separator = request.url.includes('?') ? '&' : '?';\nrequest.url += `${separator}ts=${Date.now()}`;",
  },
  {
    id: 'json-body',
    label: 'Mutate JSON body',
    section: 'beforeRequest',
    code: "const body = JSON.parse(request.body || '{}');\nbody.timestamp = Date.now();\nrequest.body = JSON.stringify(body);",
  },
];

const GRAPHQL_SNIPPETS: ScriptSnippet[] = [
  {
    id: 'graphql-header',
    label: 'Add auth header',
    section: 'beforeRequest',
    code: "request.headers['Authorization'] = 'Bearer token';",
  },
  {
    id: 'graphql-vars',
    label: 'Mutate variables',
    section: 'beforeRequest',
    code: "const variables = JSON.parse(request.variables || '{}');\nvariables.timestamp = Date.now();\nrequest.variables = JSON.stringify(variables);",
  },
];

const AFTER_SNIPPETS: ScriptSnippet[] = [
  {
    id: 'status-200',
    label: 'Test status 200',
    section: 'afterResponse',
    code: "test('status is 200', () => {\n  expect(response.status).toBe(200);\n});",
  },
  {
    id: 'json-response',
    label: 'Test JSON response',
    section: 'afterResponse',
    code: "test('response is JSON', () => {\n  const data = response.json();\n  expect(data).toBeTruthy();\n});",
  },
  {
    id: 'has-id',
    label: 'Test has id',
    section: 'afterResponse',
    code: "test('has id', () => {\n  const data = response.json();\n  expect(data.id).toBeTruthy();\n});",
  },
];

export function ScriptsEditor({ protocol, scripts, onScriptsChange }: ScriptsEditorProps) {
  const { colors } = useTheme();
  const [activeSection, setActiveSection] = useState<ScriptSection>('beforeRequest');
  const beforeRef = useRef<TextareaRenderable>(null);
  const afterRef = useRef<TextareaRenderable>(null);
  const selectAllBindings: KeyBinding[] = [{ name: 'a', ctrl: true, action: 'select-all' }];
  const beforeLabel = protocol === 'graphql' ? 'Before Query' : 'Before Request';
  const [showSnippets, setShowSnippets] = useState(false);
  const snippets = [
    ...(protocol === 'graphql' ? GRAPHQL_SNIPPETS : REST_SNIPPETS),
    ...AFTER_SNIPPETS,
  ];

  useTextareaSyntaxHighlight({
    ref: beforeRef,
    text: scripts.beforeRequest ?? '',
    language: 'text',
  });
  useTextareaSyntaxHighlight({
    ref: afterRef,
    text: scripts.afterResponse ?? '',
    language: 'text',
  });

  const updateSection = useCallback(
    (section: ScriptSection, value: string) => {
      onScriptsChange({ ...scripts, [section]: value });
    },
    [onScriptsChange, scripts],
  );

  const insertSnippet = useCallback(
    (snippet: ScriptSnippet) => {
      const current = scripts[snippet.section] ?? '';
      const next = current.trim().length > 0 ? `${current}\n\n${snippet.code}` : snippet.code;
      updateSection(snippet.section, next);
      if (snippet.section === 'beforeRequest') beforeRef.current?.replaceText(next);
      else afterRef.current?.replaceText(next);
      setActiveSection(snippet.section);
    },
    [scripts, updateSection],
  );

  const renderEditor = (
    section: ScriptSection,
    label: string,
    ref: RefObject<TextareaRenderable | null>,
    value: string,
  ) => {
    const focused = activeSection === section;
    return (
      <box style={{ flexDirection: 'column', flexGrow: 1 }}>
        <text fg={colors.accent.primary}>
          <strong>{label}</strong>
        </text>
        <box
          style={{
            flexGrow: 1,
            border: true,
            borderColor: focused ? colors.accent.primary : colors.border.default,
            backgroundColor: colors.bg.panel,
            marginTop: 0.5,
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            setActiveSection(section);
          }}
        >
          <scrollbox style={{ flexGrow: 1 }}>
            <textarea
              ref={ref}
              initialValue={value}
              placeholder={`Enter ${label.toLowerCase()} script...`}
              focused={focused}
              onContentChange={() => updateSection(section, ref.current?.plainText ?? '')}
              keyBindings={selectAllBindings}
              backgroundColor={colors.bg.panel}
              textColor={colors.text.primary}
              placeholderColor={colors.text.dim}
            />
          </scrollbox>
        </box>
      </box>
    );
  };

  return (
    <box style={{ flexDirection: 'column', gap: 1, padding: 1, height: '100%' }}>
      <scrollbox style={{ flexGrow: 1 }}>
        <box
          style={{
            alignSelf: 'flex-start',
            paddingLeft: 2,
            paddingRight: 2,
            paddingTop: 0.5,
            paddingBottom: 0.5,
            border: true,
            borderColor: showSnippets ? colors.accent.primary : colors.border.default,
          }}
          onMouseDown={() => setShowSnippets(!showSnippets)}
        >
          <text fg={showSnippets ? colors.accent.primary : colors.text.muted}>
            {showSnippets ? <strong>Hide Snippets</strong> : 'Snippet'}
          </text>
        </box>

        {showSnippets && (
          <box style={{ flexDirection: 'column', marginBottom: 1 }}>
            <box style={{ flexDirection: 'row', gap: 1, flexWrap: 'wrap' }}>
              {snippets.map((snippet) => (
                <box
                  key={snippet.id}
                  style={{
                    border: true,
                    borderColor: colors.border.default,
                    borderStyle: 'rounded',
                    paddingLeft: 1,
                    paddingRight: 1,
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    insertSnippet(snippet);
                  }}
                >
                  <text fg={colors.text.muted}>{snippet.label}</text>
                </box>
              ))}
            </box>
          </box>
        )}

        <box style={{ flexDirection: 'row', gap: 1, flexGrow: 1 }}>
          {renderEditor('beforeRequest', beforeLabel, beforeRef, scripts.beforeRequest ?? '')}
          {renderEditor('afterResponse', 'After Response', afterRef, scripts.afterResponse ?? '')}
        </box>
      </scrollbox>
    </box>
  );
}
