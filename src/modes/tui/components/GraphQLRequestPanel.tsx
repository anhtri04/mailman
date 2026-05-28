import { useState, useCallback, useRef, useEffect } from 'react';
import type { KeyBinding, TextareaRenderable } from '@opentui/core';
import { useKeyboard } from '@opentui/react';
import { useTheme } from '../../../shared/theme/ThemeProvider';
import type { AuthConfig, RequestScripts } from '../../../types';
import {
  formatGraphQLQuery,
  formatGraphQLVariables,
} from '../../../shared/utils/request-formatter';
import { useTextareaSyntaxHighlight } from '../hooks/useTextareaSyntaxHighlight';

type Tab = 'headers' | 'auth' | 'scripts';
type ActiveEditor = 'url' | 'query' | 'variables' | null;

interface GraphQLRequestPanelProps {
  focused: boolean;
  onFocus: () => void;
  url: string;
  onUrlChange: (url: string) => void;
  query: string;
  onQueryChange: (query: string) => void;
  variables: string;
  onVariablesChange: (variables: string) => void;
  headers?: Record<string, string>;
  onHeadersChange: (headers: Record<string, string>) => void;
  auth?: AuthConfig;
  scripts?: RequestScripts;
  onAuthChange: (auth: AuthConfig) => void;
  onSend: () => void;
  onOpenHeaders: () => void;
  onOpenAuth: () => void;
  onOpenScripts: () => void;
  requestName?: string;
  saveStatus?: 'idle' | 'saved' | 'error';
  isModalOpen?: boolean;
}

export function GraphQLRequestPanel({
  focused,
  onFocus,
  url,
  onUrlChange,
  query,
  onQueryChange,
  variables,
  onVariablesChange,
  headers = {},
  onHeadersChange: _onHeadersChange,
  auth,
  scripts,
  onAuthChange: _onAuthChange,
  onSend,
  onOpenHeaders,
  onOpenAuth,
  onOpenScripts,
  requestName,
  saveStatus = 'idle',
  isModalOpen = false,
}: GraphQLRequestPanelProps) {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab | null>(null);
  const [activeEditor, setActiveEditor] = useState<ActiveEditor>(null);
  const [queryFormatStatus, setQueryFormatStatus] = useState<string | null>(null);
  const [variablesFormatStatus, setVariablesFormatStatus] = useState<string | null>(null);
  const queryRef = useRef<TextareaRenderable>(null);
  const variablesRef = useRef<TextareaRenderable>(null);
  const queryStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const variablesStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectAllBindings: KeyBinding[] = [{ name: 'a', ctrl: true, action: 'select-all' }];

  const hasHeaders = Object.keys(headers).length > 0;
  const hasAuth = !!(auth && auth.type !== 'none');
  const hasScripts = !!scripts?.beforeRequest?.trim() || !!scripts?.afterResponse?.trim();
  const urlEditorFocused = focused && activeEditor === 'url';
  const queryEditorFocused = focused && activeEditor === 'query';
  const variablesEditorFocused = focused && activeEditor === 'variables';

  useTextareaSyntaxHighlight({
    ref: queryRef,
    text: query,
    language: 'graphql',
  });

  useTextareaSyntaxHighlight({
    ref: variablesRef,
    text: variables,
    language: 'json',
  });

  useEffect(() => {
    if (!isModalOpen) {
      setActiveTab(null);
    }
  }, [isModalOpen]);

  const openTab = useCallback(
    (tab: Tab) => {
      setActiveEditor(null);
      if (activeTab === tab) {
        setActiveTab(null);
      } else {
        setActiveTab(tab);
        if (tab === 'headers') onOpenHeaders();
        else if (tab === 'auth') onOpenAuth();
        else if (tab === 'scripts') onOpenScripts();
      }
      onFocus(); // Focus the Request Panel when opening its Tabs
    },
    [onFocus, activeTab, onOpenHeaders, onOpenAuth, onOpenScripts],
  );

  const handleTabClick = useCallback(
    (tab: Tab) => (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      openTab(tab);
    },
    [openTab],
  );

  const handleQueryChange = useCallback(() => {
    if (queryRef.current) {
      onQueryChange(queryRef.current.plainText);
    }
  }, [onQueryChange]);

  const handleVariablesChange = useCallback(() => {
    if (variablesRef.current) {
      onVariablesChange(variablesRef.current.plainText);
    }
  }, [onVariablesChange]);

  const showQueryFormatStatus = useCallback((status: string) => {
    setQueryFormatStatus(status);
    if (queryStatusTimerRef.current) {
      clearTimeout(queryStatusTimerRef.current);
    }
    queryStatusTimerRef.current = setTimeout(() => setQueryFormatStatus(null), 1500);
  }, []);

  const showVariablesFormatStatus = useCallback((status: string) => {
    setVariablesFormatStatus(status);
    if (variablesStatusTimerRef.current) {
      clearTimeout(variablesStatusTimerRef.current);
    }
    variablesStatusTimerRef.current = setTimeout(() => setVariablesFormatStatus(null), 1500);
  }, []);

  useKeyboard((key) => {
    if (!focused) return;

    if (key.ctrl && key.name === 'f') {
      key.preventDefault();
      key.stopPropagation();

      if (activeEditor === 'query') {
        const currentQuery = queryRef.current?.plainText ?? query;
        const result = formatGraphQLQuery(currentQuery);
        if (result.error) {
          showQueryFormatStatus(result.error);
          return;
        }
        if (!result.changed) {
          showQueryFormatStatus('Already formatted');
          return;
        }
        queryRef.current?.replaceText(result.value);
        onQueryChange(result.value);
        showQueryFormatStatus('Formatted ✓');
        return;
      }

      if (activeEditor === 'variables') {
        const currentVariables = variablesRef.current?.plainText ?? variables;
        const result = formatGraphQLVariables(currentVariables);
        if (result.error) {
          showVariablesFormatStatus(result.error);
          return;
        }
        if (!result.changed) {
          showVariablesFormatStatus('Already formatted');
          return;
        }
        variablesRef.current?.replaceText(result.value);
        onVariablesChange(result.value);
        showVariablesFormatStatus('Formatted ✓');
      }

      return;
    }

    if (isModalOpen || activeEditor !== null) return;
    if (key.ctrl) return;

    const shortcutTabs: Record<string, Tab> = {
      h: 'headers',
      a: 'auth',
      s: 'scripts',
    };

    const tab = key.name ? shortcutTabs[key.name.toLowerCase()] : undefined;
    if (!tab) return;

    key.preventDefault();
    key.stopPropagation();
    openTab(tab);
  });

  const renderTabButton = useCallback(
    (tab: Tab, label: string, hasData: boolean) => {
      const isActive = activeTab === tab;
      const displayLabel = hasData ? `${label} ●` : label;
      return (
        <box
          style={{
            paddingLeft: 2,
            paddingRight: 2,
            paddingTop: 0.5,
            paddingBottom: 0.5,
            border: true,
            borderColor: isActive ? colors.accent.primary : colors.border.default,
            borderStyle: 'rounded',
          }}
          onMouseDown={handleTabClick(tab)}
        >
          <text fg={isActive ? colors.accent.primary : colors.text.muted}>
            {isActive ? <strong>{displayLabel}</strong> : displayLabel}
          </text>
        </box>
      );
    },
    [activeTab, handleTabClick, colors],
  );

  return (
    <box
      style={{
        flexDirection: 'column',
        border: true,
        borderColor: focused ? colors.accent.primary : colors.border.default,
        padding: 1,
        flexGrow: 1,
        borderStyle: 'rounded',
      }}
      onMouseDown={() => {
        setActiveEditor(null);
        onFocus();
      }}
    >
      <box style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: -2 }}>
        <text
          fg={colors.accent.primary}
          bg={colors.bg.app}
          style={{ paddingLeft: 1, paddingRight: 1 }}
        >
          <strong> Request </strong>
        </text>
        <box style={{ flexDirection: 'row', gap: 1 }}>
          {requestName && (
            <text
              fg={colors.text.muted}
              bg={colors.bg.app}
              style={{ paddingLeft: 1, paddingRight: 1 }}
            >
              {requestName}
            </text>
          )}
          {saveStatus === 'saved' && (
            <text fg="#44cc88" bg={colors.bg.app} style={{ paddingLeft: 1, paddingRight: 1 }}>
              Saved ✓
            </text>
          )}
          {saveStatus === 'error' && (
            <text fg="#cc4444" bg={colors.bg.app} style={{ paddingLeft: 1, paddingRight: 1 }}>
              Save failed
            </text>
          )}
        </box>
      </box>

      <box style={{ flexDirection: 'row', gap: 1, marginTop: 1 }}>
        <box
          style={{
            border: true,
            borderColor: urlEditorFocused ? colors.accent.primary : colors.border.default,
            paddingLeft: 1,
            paddingRight: 1,
            paddingTop: 0.5,
            paddingBottom: 0.5,
            borderStyle: 'rounded',
            flexGrow: 1,
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            setActiveEditor('url');
            onFocus();
          }}
        >
          <input
            placeholder="GraphQL endpoint URL..."
            value={url}
            onInput={onUrlChange}
            focused={urlEditorFocused}
            keyBindings={selectAllBindings}
          />
        </box>
      </box>

      <box style={{ flexDirection: 'row', gap: 1, justifyContent: 'space-between', marginTop: 1 }}>
        <box style={{ flexDirection: 'row' }}>
          {renderTabButton('headers', 'Headers', hasHeaders)}
          {renderTabButton('auth', 'Auth', hasAuth)}
          {renderTabButton('scripts', 'Scripts', hasScripts)}
        </box>
        <box
          style={{
            marginLeft: 1,
            border: true,
            borderColor: colors.accent.primary,
            paddingLeft: 2,
            paddingRight: 2,
            paddingTop: 0.5,
            paddingBottom: 0.5,
            borderStyle: 'double',
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            setActiveEditor(null);
            onSend();
          }}
        >
          <text fg={colors.accent.primary}>
            <strong>Send</strong>
          </text>
        </box>
      </box>

      <box style={{ flexDirection: 'column', flexGrow: 1, marginTop: 1 }}>
        <text fg={colors.accent.primary}>
          <strong>Query</strong>
          {queryFormatStatus ? `  ${queryFormatStatus}` : ''}
        </text>
        <box
          style={{
            flexGrow: 1,
            border: true,
            borderColor: queryEditorFocused ? colors.accent.primary : colors.border.default,
            backgroundColor: colors.bg.panel,
            marginTop: 0.5,
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            setActiveEditor('query');
            onFocus();
          }}
        >
          <scrollbox style={{ flexGrow: 1 }}>
            <textarea
              ref={queryRef}
              placeholder="Enter GraphQL query or mutation..."
              initialValue={query}
              focused={queryEditorFocused}
              onContentChange={handleQueryChange}
              keyBindings={selectAllBindings}
              backgroundColor={colors.bg.panel}
              textColor={colors.text.primary}
              placeholderColor={colors.text.dim}
            />
          </scrollbox>
        </box>
      </box>

      <box style={{ flexDirection: 'column', height: '60%' }}>
        <text fg={colors.accent.primary}>
          <strong>Variables</strong>
          {variablesFormatStatus ? `  ${variablesFormatStatus}` : ''}
        </text>
        <box
          style={{
            flexGrow: 1,
            border: true,
            borderColor: variablesEditorFocused ? colors.accent.primary : colors.border.default,
            backgroundColor: colors.bg.panel,
            marginTop: 0.5,
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            setActiveEditor('variables');
            onFocus();
          }}
        >
          <scrollbox style={{ flexGrow: 1 }}>
            <textarea
              ref={variablesRef}
              placeholder='Ex: {"id": "123"}'
              initialValue={variables}
              focused={variablesEditorFocused}
              onContentChange={handleVariablesChange}
              keyBindings={selectAllBindings}
              backgroundColor={colors.bg.panel}
              textColor={colors.text.primary}
              placeholderColor={colors.text.dim}
            />
          </scrollbox>
        </box>
      </box>
    </box>
  );
}
