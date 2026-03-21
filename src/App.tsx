import { useState, useCallback } from 'react';
import { useKeyboard } from '@opentui/react';
import { useFocus } from './hooks';
import { RequestPanel, ResponsePanel, Modal } from './components';
import { HeadersEditor } from './components/HeadersEditor';
import { BodyEditor } from './components/BodyEditor';
import { QueryParamsEditor } from './components/QueryParamsEditor';
import { AuthEditor } from './components/AuthEditor';
import { sendRequest } from './services/http-client';
import type { RequestOptions, ResponseState, AuthConfig } from './types';

type Tab = 'headers' | 'body' | 'query' | 'auth';

export function App() {
  const { focusedArea, setFocus, isFocused } = useFocus();
  const [request, setRequest] = useState<RequestOptions>({
    method: 'GET',
    url: '',
    headers: {},
    body: '',
  });
  const [response, setResponse] = useState<ResponseState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeModal, setActiveModal] = useState<Tab | null>(null);

  useKeyboard((key) => {
    if (key.name === 'escape' && activeModal) {
      setActiveModal(null);
    } else if (key.ctrl && key.name === 'q') {
      const cleanExit = (globalThis as any).__mailmanCleanExit;
      if (cleanExit) cleanExit();
    }
  });

  const handleUrlChange = useCallback((url: string) => {
    setRequest((prev) => ({ ...prev, url }));
  }, []);

  const handleMethodChange = useCallback((method: string) => {
    setRequest((prev) => ({ ...prev, method }));
  }, []);

  const handleHeadersChange = useCallback((headers: Record<string, string>) => {
    setRequest((prev) => ({ ...prev, headers }));
  }, []);

  const handleBodyChange = useCallback((body: string) => {
    setRequest((prev) => ({ ...prev, body }));
  }, []);

  const handleAuthChange = useCallback((auth: AuthConfig) => {
    setRequest((prev) => ({ ...prev, auth }));
  }, []);

  // Extract base URL without query params for QueryParamsEditor
  const baseUrl = request.url.split('?')[0] ?? request.url;
  const queryParams: Record<string, string> = {};
  try {
    const urlObj = new URL(
      request.url.startsWith('http') ? request.url : `http://localhost${request.url}`,
    );
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
        handleUrlChange(baseUrl);
        return;
      }
      const encodedParams = paramsList
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
      handleUrlChange(`${baseUrl}?${encodedParams}`);
    },
    [baseUrl, handleUrlChange],
  );

  const handleSend = useCallback(async () => {
    if (!request.url) return;

    setIsLoading(true);

    try {
      const result = await sendRequest(request);
      setResponse(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setResponse({
        status: 0,
        statusText: 'ERROR',
        body: `Error: ${errorMessage}`,
        headers: {},
        time: 0,
      });
    } finally {
      setIsLoading(false);
    }
  }, [request]);

  return (
    <box
      style={{
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'black',
        padding: 1,
      }}
    >
      <box style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1 }}>
        <text fg="#CC8844">
          <strong>Mailman v0.0.1</strong>
        </text>
        <text fg="#999999">Click panels to focus • Press Q to quit • Press H for help</text>
      </box>

      <box height="40%" style={{ flexDirection: 'column' }}>
        <RequestPanel
          focused={isFocused('request')}
          onFocus={() => setFocus('request')}
          url={request.url}
          onUrlChange={handleUrlChange}
          method={request.method}
          onMethodChange={handleMethodChange}
          onSend={handleSend}
          headers={request.headers}
          onHeadersChange={handleHeadersChange}
          body={request.body}
          onBodyChange={handleBodyChange}
          queryParams={queryParams}
          auth={request.auth}
          onOpenHeaders={() => setActiveModal('headers')}
          onOpenBody={() => setActiveModal('body')}
          onOpenQuery={() => setActiveModal('query')}
          onOpenAuth={() => setActiveModal('auth')}
        />
      </box>

      <box height="60%" style={{ flexDirection: 'column', marginTop: 1 }}>
        <ResponsePanel
          focused={isFocused('response')}
          onFocus={() => setFocus('response')}
          response={response}
        />
      </box>

      {isLoading && (
        <box
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            backgroundColor: '#1a1a1a',
            border: true,
            borderColor: '#CC8844',
            padding: 1,
          }}
        >
          <text fg="#CC8844">Loading...</text>
        </box>
      )}

      {/* Modal popups for editors - rendered at App level for full screen sizing */}
      {activeModal === 'headers' && (
        <Modal isOpen={true} onClose={() => setActiveModal(null)} title="Headers">
          <HeadersEditor headers={request.headers ?? {}} onHeadersChange={handleHeadersChange} />
        </Modal>
      )}

      {activeModal === 'body' && (
        <Modal isOpen={true} onClose={() => setActiveModal(null)} title="Request Body">
          <BodyEditor body={request.body ?? ''} onBodyChange={handleBodyChange} focused={true} />
        </Modal>
      )}

      {activeModal === 'query' && (
        <Modal isOpen={true} onClose={() => setActiveModal(null)} title="Query Parameters">
          <QueryParamsEditor
            baseUrl={baseUrl}
            params={queryParams}
            onParamsChange={handleQueryParamsChange}
          />
        </Modal>
      )}

      {activeModal === 'auth' && (
        <Modal isOpen={true} onClose={() => setActiveModal(null)} title="Authentication">
          <AuthEditor auth={request.auth} onAuthChange={handleAuthChange} />
        </Modal>
      )}
    </box>
  );
}
