import { useState, useCallback } from 'react';
import { colors } from '../theme/colors';
import type { AuthConfig } from '../types';

type Tab = 'headers' | 'body' | 'query' | 'auth';

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
  body?: string;
  onBodyChange: (body: string) => void;
  queryParams?: Record<string, string>;
  auth?: AuthConfig;
  onOpenHeaders: () => void;
  onOpenBody: () => void;
  onOpenQuery: () => void;
  onOpenAuth: () => void;
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
  body = '',
  onBodyChange,
  queryParams = {},
  auth,
  onOpenHeaders,
  onOpenBody,
  onOpenQuery,
  onOpenAuth,
}: RequestPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab | null>(null);
  const borderColor = focused ? colors.accent.primary : colors.border.default;

  // Check if each section has data for indicator
  const hasHeaders = Object.keys(headers).length > 0;
  const hasBody = !!body && body.trim().length > 0;
  const hasQuery = Object.keys(queryParams).length > 0;
  const hasAuth = !!auth && auth.type !== 'none';

  const handleTabClick = useCallback(
    (tab: Tab) => (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      // Toggle: if clicking same tab, close it; otherwise open new one
      if (activeTab === tab) {
        setActiveTab(null);
      } else {
        setActiveTab(tab);
        if (tab === 'headers') onOpenHeaders();
        else if (tab === 'body') onOpenBody();
        else if (tab === 'query') onOpenQuery();
        else if (tab === 'auth') onOpenAuth();
      }
    },
    [activeTab, onOpenHeaders, onOpenBody, onOpenQuery, onOpenAuth],
  );

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
            backgroundColor: isActive ? colors.accent.primary : undefined,
          }}
          onMouseDown={handleTabClick(tab)}
        >
          <text fg={isActive ? colors.bg.app : colors.text.muted}>
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
      }}
      onMouseDown={onFocus}
    >
      <text fg={colors.accent.primary}>
        <strong>Request</strong>
      </text>

      <box style={{ flexDirection: 'row', gap: 1, marginTop: 1 }}>
        <box
          style={{
            border: true,
            borderColor: colors.border.default,
            paddingLeft: 1,
            paddingRight: 1,
            paddingTop: 0.5,
            paddingBottom: 0.5,
            backgroundColor:
              colors.methods[method as keyof typeof colors.methods]?.bg ?? colors.bg.panel,
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
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
            borderColor: focused ? colors.accent.primary : colors.border.default,
            paddingLeft: 1,
            paddingRight: 1,
            paddingTop: 0.5,
            paddingBottom: 0.5,
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
        >
          <input placeholder="Enter URL..." value={url} onInput={onUrlChange} focused={focused} />
        </box>
      </box>

      <box style={{ flexDirection: 'row', gap: 1, marginTop: 1 }}>
        {renderTabButton('headers', 'Headers', hasHeaders)}
        {renderTabButton('body', 'Body', hasBody)}
        {renderTabButton('query', 'Query', hasQuery)}
        {renderTabButton('auth', 'Auth', hasAuth)}

        <box
          style={{
            marginLeft: 1,
            border: true,
            borderColor: colors.accent.primary,
            backgroundColor: colors.accent.primary,
            paddingLeft: 2,
            paddingRight: 2,
            paddingTop: 0.5,
            paddingBottom: 0.5,
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            onSend();
          }}
        >
          <text fg={colors.bg.app}>
            <strong>Send</strong>
          </text>
        </box>
      </box>
    </box>
  );
}
