import { useState, useCallback, useRef } from 'react';
import type { KeyBinding, TextareaRenderable } from '@opentui/core';
import { useTheme } from '../../../shared/theme/ThemeProvider';
import type { AuthConfig } from '../../../types';

type Tab = 'headers' | 'auth';

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
  onAuthChange: (auth: AuthConfig) => void;
  onSend: () => void;
  onOpenHeaders: () => void;
  onOpenAuth: () => void;
  requestName?: string;
  saveStatus?: 'idle' | 'saved' | 'error';
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
  onHeadersChange,
  auth,
  onAuthChange,
  onSend,
  onOpenHeaders,
  onOpenAuth,
  requestName,
  saveStatus = 'idle',
}: GraphQLRequestPanelProps) {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab | null>(null);
  const queryRef = useRef<TextareaRenderable>(null);
  const variablesRef = useRef<TextareaRenderable>(null);
  const selectAllBindings: KeyBinding[] = [{ name: 'a', ctrl: true, action: 'select-all' }];

  const hasVariables = !!(variables && variables.trim().length > 0);
  const hasHeaders = Object.keys(headers).length > 0;
  const hasAuth = !!(auth && auth.type !== 'none');

  const handleTabClick = useCallback(
    (tab: Tab) => (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      if (activeTab === tab) {
        setActiveTab(null);
      } else {
        setActiveTab(tab);
        if (tab === 'headers') onOpenHeaders();
        else if (tab === 'auth') onOpenAuth();
      }
      onFocus();  // Focus the Request Panel if clicking its Tabs
    },
    [onFocus, activeTab, onOpenHeaders, onOpenAuth],
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
      onMouseDown={onFocus}
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
            borderColor: focused ? colors.accent.primary : colors.border.default,
            paddingLeft: 1,
            paddingRight: 1,
            paddingTop: 0.5,
            paddingBottom: 0.5,
            borderStyle: 'rounded',
            flexGrow: 1,
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
        >
          <input
            placeholder="GraphQL endpoint URL..."
            value={url}
            onInput={onUrlChange}
            focused={focused}
            keyBindings={selectAllBindings}
          />
        </box>
      </box>

      <box style={{ flexDirection: 'row', gap: 1, justifyContent: 'space-between', marginTop: 1 }}>
        <box style={{ flexDirection: 'row' }}>
          {renderTabButton('headers', 'Headers', hasHeaders)}
          {renderTabButton('auth', 'Auth', hasAuth)}
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
        </text>
        <box
          style={{
            flexGrow: 1,
            border: true,
            borderColor: focused ? colors.accent.primary : colors.border.default,
            backgroundColor: colors.bg.panel,
            marginTop: 0.5,
          }}
        >
          <scrollbox style={{ flexGrow: 1 }}>
            <textarea
              ref={queryRef}
              placeholder="Enter GraphQL query or mutation..."
              initialValue={query}
              focused={focused}
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
        </text>
        <box
          style={{
            flexGrow: 1,
            border: true,
            borderColor: focused ? colors.accent.primary : colors.border.default,
            backgroundColor: colors.bg.panel,
            marginTop: 0.5,
          }}
        >
          <scrollbox style={{ flexGrow: 1 }}>
            <textarea
              ref={variablesRef}
              placeholder='Ex: {"id": "123"}'
              initialValue={variables}
              focused={focused}
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
