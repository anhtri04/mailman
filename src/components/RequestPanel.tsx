import { useState, useCallback } from 'react';
import { HeadersEditor } from './HeadersEditor';
import { BodyEditor } from './BodyEditor';
import { QueryParamsEditor } from './QueryParamsEditor';

type Tab = 'headers' | 'body' | 'query';

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
}: RequestPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('headers');
  const borderColor = focused ? '#CC8844' : '#555555';

  const handleTabClick = useCallback(
    (tab: Tab) => (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      setActiveTab(tab);
    },
    [],
  );

  const renderTabButton = useCallback(
    (tab: Tab, label: string) => {
      const isActive = activeTab === tab;
      return (
        <box
          style={{
            paddingLeft: 2,
            paddingRight: 2,
            border: true,
            borderColor: isActive ? '#CC8844' : '#555555',
            backgroundColor: isActive ? '#CC8844' : undefined,
          }}
          onMouseDown={handleTabClick(tab)}
        >
          <text fg={isActive ? '#000000' : '#999999'}>
            {isActive ? <strong>{label}</strong> : label}
          </text>
        </box>
      );
    },
    [activeTab, handleTabClick],
  );

  // Extract base URL without query params for QueryParamsEditor
  const baseUrl = url.split('?')[0] ?? url;
  const queryParams: Record<string, string> = {};
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `http://localhost${url}`);
    urlObj.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });
  } catch {
    // Invalid URL, ignore query params
  }

  const handleQueryParamsChange = useCallback(
    (newParams: Record<string, string>) => {
      const paramsList = Object.entries(newParams).filter(([, value]) => value !== '');
      if (paramsList.length === 0) {
        onUrlChange(baseUrl);
        return;
      }
      const encodedParams = paramsList
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
      onUrlChange(`${baseUrl}?${encodedParams}`);
    },
    [baseUrl, onUrlChange],
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
      <text fg="#CC8844">
        <strong>Request</strong>
      </text>

      <box style={{ flexDirection: 'row', gap: 1, marginTop: 1 }}>
        <box
          style={{
            border: true,
            borderColor: '#555555',
            paddingLeft: 1,
            paddingRight: 1,
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
          <text fg="#FFFFFF">{method}</text>
        </box>

        <box
          style={{
            flexGrow: 1,
            border: true,
            borderColor: focused ? '#CC8844' : '#555555',
            paddingLeft: 1,
            paddingRight: 1,
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
        >
          <input placeholder="Enter URL..." value={url} onInput={onUrlChange} focused={focused} />
        </box>
      </box>

      <box style={{ flexDirection: 'row', gap: 1, marginTop: 1 }}>
        {renderTabButton('headers', 'Headers')}
        {renderTabButton('body', 'Body')}
        {renderTabButton('query', 'Query')}

        <box
          style={{
            marginLeft: 1,
            border: true,
            borderColor: '#CC8844',
            backgroundColor: '#CC8844',
            paddingLeft: 2,
            paddingRight: 2,
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            onSend();
          }}
        >
          <text fg="#000000">
            <strong>Send</strong>
          </text>
        </box>
      </box>

      <scrollbox
        style={{
          flexGrow: 1,
          flexDirection: 'column',
          marginTop: 1,
        }}
      >
        {activeTab === 'headers' && (
          <HeadersEditor headers={headers} onHeadersChange={onHeadersChange} />
        )}
        {activeTab === 'body' && (
          <BodyEditor body={body} onBodyChange={onBodyChange} focused={focused} />
        )}
        {activeTab === 'query' && (
          <QueryParamsEditor
            baseUrl={baseUrl}
            params={queryParams}
            onParamsChange={handleQueryParamsChange}
          />
        )}
      </scrollbox>
    </box>
  );
}
