import { useState, useCallback, useEffect } from 'react';
import { useKeyboard } from '@opentui/react';
import { useTheme } from '../../../shared/theme/ThemeProvider';
import type { AuthConfig, RequestBody, RequestScripts } from '../../../types';
import { requestBodyHasContent } from '../../../core/services';

type Tab = 'headers' | 'body' | 'query' | 'auth' | 'scripts';
type ActiveEditor = 'url' | null;

interface RequestPanelProps {
  focused: boolean;
  onFocus: () => void;
  url: string;
  onUrlChange: (url: string) => void;
  method: string;
  onMethodChange: (method: string) => void;
  onSend: () => void;
  headers?: Record<string, string>;
  onHeadersChange: (headers: Record<string, string>) => void;
  body: RequestBody;
  onBodyChange: (body: RequestBody) => void;
  queryParams?: Record<string, string>;
  auth?: AuthConfig;
  scripts?: RequestScripts;
  onOpenHeaders: () => void;
  onOpenBody: () => void;
  onOpenQuery: () => void;
  onOpenAuth: () => void;
  onOpenScripts: () => void;
  requestName?: string;
  saveStatus?: 'idle' | 'saved' | 'error';
  isModalOpen?: boolean;
}

const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

export function RequestPanel({
  focused,
  onFocus,
  url,
  onUrlChange,
  method,
  onMethodChange,
  onSend,
  headers = {},
  onHeadersChange,
  body,
  onBodyChange,
  queryParams = {},
  auth,
  scripts,
  onOpenHeaders,
  onOpenBody,
  onOpenQuery,
  onOpenAuth,
  onOpenScripts,
  requestName,
  saveStatus = 'idle',
  isModalOpen = false,
}: RequestPanelProps) {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab | null>(null);
  const [activeEditor, setActiveEditor] = useState<ActiveEditor>(null);
  const borderColor = focused ? colors.accent.primary : colors.border.default;
  const urlEditorFocused = focused && activeEditor === 'url';

  // Check if each section has data for indicator
  const hasHeaders = Object.keys(headers).length > 0;
  const hasBody = requestBodyHasContent(body);
  const hasQuery = Object.keys(queryParams).length > 0;
  const hasAuth = !!auth && auth.type !== 'none';
  const hasScripts = !!scripts?.beforeRequest?.trim() || !!scripts?.afterResponse?.trim();

  const openTab = useCallback(
    (tab: Tab) => {
      setActiveEditor(null);
      // Toggle: if opening same tab, close it; otherwise open new one
      if (activeTab === tab) {
        setActiveTab(null);
      } else {
        setActiveTab(tab);
        if (tab === 'headers') onOpenHeaders();
        else if (tab === 'body') onOpenBody();
        else if (tab === 'query') onOpenQuery();
        else if (tab === 'auth') onOpenAuth();
        else if (tab === 'scripts') onOpenScripts();
      }
      onFocus(); // Focus the Request Panel when opening its Tabs
    },
    [onFocus, activeTab, onOpenHeaders, onOpenBody, onOpenQuery, onOpenAuth, onOpenScripts],
  );

  const handleTabClick = useCallback(
    (tab: Tab) => (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      openTab(tab);
    },
    [openTab],
  );

  useEffect(() => {
    if (!isModalOpen) {
      setActiveTab(null);
    }
  }, [isModalOpen]);

  useKeyboard((key) => {
    if (!focused || isModalOpen || activeEditor !== null) return;
    if (key.ctrl) return;

    const shortcutTabs: Record<string, Tab> = {
      h: 'headers',
      b: 'body',
      q: 'query',
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
    [activeTab, handleTabClick],
  );

  return (
    <box
      style={{
        flexDirection: 'column',
        border: true,
        borderColor,
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
            paddingLeft: 1,
            paddingRight: 1,
            paddingTop: 0.5,
            paddingBottom: 0.5,
            borderStyle: 'double',
            alignItems: 'center',
            borderColor:
              colors.methods[method as keyof typeof colors.methods]?.bg ?? colors.bg.panel,
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            setActiveEditor(null);
            const currentIndex = METHODS.indexOf(method);
            const nextIndex = (currentIndex + 1) % METHODS.length;
            const nextMethod = METHODS[nextIndex];
            if (nextMethod) {
              onMethodChange(nextMethod);
            }
          }}
        >
          <text
            fg={colors.methods[method as keyof typeof colors.methods]?.text ?? colors.text.primary}
          >
            {method}
          </text>
        </box>

        <box
          style={{
            flexGrow: 1,
            border: true,
            borderColor: urlEditorFocused ? colors.accent.primary : colors.border.default,
            paddingLeft: 1,
            paddingRight: 1,
            paddingTop: 0.5,
            paddingBottom: 0.5,
            borderStyle: 'rounded',
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            setActiveEditor('url');
            onFocus();
          }}
        >
          <input
            placeholder="Enter URL..."
            value={url}
            onInput={onUrlChange}
            focused={urlEditorFocused}
          />
        </box>
      </box>

      <box style={{ flexDirection: 'row', gap: 1, marginTop: 1 }}>
        {renderTabButton('headers', 'Headers', hasHeaders)}
        {renderTabButton('body', 'Body', hasBody)}
        {renderTabButton('query', 'Query', hasQuery)}
        {renderTabButton('auth', 'Auth', hasAuth)}
        {renderTabButton('scripts', 'Scripts', hasScripts)}

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
    </box>
  );
}
