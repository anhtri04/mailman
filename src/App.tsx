import { useState, useCallback } from 'react';
import { useKeyboard } from '@opentui/react';
import { useFocus } from './hooks';
import { RequestPanel, ResponsePanel } from './components';
import { sendRequest } from './services/http-client';
import type { RequestOptions, ResponseState } from './types';

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

  useKeyboard((key) => {
    if (key.name === 'q') {
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
        <text fg="#999999">Click panels to focus • Press Q to quit</text>
      </box>

      <box style={{ flexGrow: 2, flexDirection: 'column' }}>
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
        />
      </box>

      <box style={{ flexGrow: 3, flexDirection: 'column', marginTop: 1 }}>
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
    </box>
  );
}
