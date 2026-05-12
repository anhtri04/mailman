import { useState, useCallback, useEffect } from 'react';
import { useKeyboard } from '@opentui/react';
import { useFocus } from './hooks';
import {
  RequestPanel,
  ResponsePanel,
  CollectionPanel,
  Modal,
  ResponseModal,
  WelcomePanel,
  CatalogPanel,
  GraphQLRequestPanel,
  GraphQLResponsePanel,
  FileBrowser,
} from './components';
import { HeadersEditor } from './components/HeadersEditor';
import { BodyEditor } from './components/BodyEditor';
import { QueryParamsEditor } from './components/QueryParamsEditor';
import { AuthEditor } from './components/AuthEditor';
import { ThemeSelector } from './components/ThemeSelector';
import { useTheme } from './theme/ThemeProvider';
import {
  sendRequest,
  sendRequestWithStreaming,
  sendGraphQLRequest,
  loadCollections,
  saveCollections,
  addCollection,
  addRequestToCollection,
  updateRequest,
  deleteCollection,
  deleteRequest,
  importCollectionsFromFile,
} from './services';
import { parseCurl } from './utils/curlUtility';
import type {
  RequestOptions,
  ResponseState,
  AuthConfig,
  Collection,
  RequestItem,
  Protocol,
} from './types';

type Tab = 'headers' | 'body' | 'query' | 'auth';

export function App() {
  const { setFocus, isFocused } = useFocus();
  const { colors } = useTheme();
  const [request, setRequest] = useState<RequestOptions>({
    method: 'GET',
    url: '',
    headers: {},
    body: '',
  });
  const [graphqlRequest, setGraphqlRequest] = useState<{
    url: string;
    query: string;
    variables: string;
    headers: Record<string, string>;
    auth?: AuthConfig;
  }>({
    url: '',
    query: '',
    variables: '',
    headers: {},
  });
  const [restResponses, setRestResponses] = useState<Record<string, ResponseState>>({});
  const [restStreamControllers, setRestStreamControllers] = useState<
    Record<string, { disconnect: () => void }>
  >({});
  const [graphqlResponses, setGraphqlResponses] = useState<Record<string, ResponseState>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isCollectionCollapsed, setIsCollectionCollapsed] = useState(false);
  const [activeModal, setActiveModal] = useState<Tab | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [requestName, setRequestName] = useState<string>('');

  const [collectionModal, setCollectionModal] = useState<'import' | 'add' | 'export' | null>(null);
  const [collectionModalMode, setCollectionModalMode] = useState<'new' | 'import'>('new');
  const [importError, setImportError] = useState<string | null>(null);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionProtocol, setNewCollectionProtocol] = useState<Protocol>('rest');
  const [newRequestMethod, setNewRequestMethod] = useState('GET');
  const [newRequestName, setNewRequestName] = useState('');
  const [curlText, setCurlText] = useState('');
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);

  const currentResponse = activeRequestId ? (restResponses[activeRequestId] ?? null) : null;
  const currentGraphqlResponse = activeRequestId
    ? (graphqlResponses[activeRequestId] ?? null)
    : null;

  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const SSE_MAX_EVENTS = 500;

  const activeCollection = activeCollectionId
    ? collections.find((c) => c.id === activeCollectionId)
    : undefined;
  const currentProtocol = activeCollection?.protocol ?? 'rest';

  useEffect(() => {
    void (async () => {
      try {
        const loaded = await loadCollections();
        setCollections(loaded);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('Failed to load collections:', message);
      }
    })();
  }, []);

  useEffect(() => {
    if (saveStatus !== 'idle') {
      const timer = setTimeout(() => setSaveStatus('idle'), 2000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  useEffect(() => {
    return () => {
      Object.values(restStreamControllers).forEach((controller) => controller.disconnect());
    };
  }, [restStreamControllers]);

  useKeyboard((key) => {
    if (key.name === 'escape') {
      if (showThemeSelector) {
        setShowThemeSelector(false);
        return;
      }
      if (showHelp) {
        setShowHelp(false);
        return;
      }
      if (showResponseModal) {
        setShowResponseModal(false);
        return;
      }
      if (activeModal) {
        setActiveModal(null);
      } else if (collectionModal) {
        setCollectionModal(null);
      }
    } else if (key.ctrl && key.name === 'q') {
      const cleanExit = (globalThis as any).__mailmanCleanExit;
      if (cleanExit) cleanExit();
    } else if (key.ctrl && key.name === 'g') {
      if (
        !showHelp &&
        !showThemeSelector &&
        !activeModal &&
        !collectionModal &&
        !showResponseModal
      ) {
        setShowHelp(true);
      }
    } else if (key.ctrl && key.name === 't') {
      if (
        !showThemeSelector &&
        !showHelp &&
        !activeModal &&
        !collectionModal &&
        !showResponseModal
      ) {
        setShowThemeSelector(true);
      }
    } else if (key.ctrl && key.name === 's') {
      if (activeRequestId && activeCollectionId) {
        void (async () => {
          try {
            await updateRequest(
              activeCollectionId,
              activeRequestId,
              currentProtocol === 'graphql'
                ? {
                    method: 'POST',
                    url: graphqlRequest.url,
                    headers: graphqlRequest.headers,
                    body: graphqlRequest.query,
                    variables: graphqlRequest.variables,
                    auth: graphqlRequest.auth,
                  }
                : {
                    method: request.method,
                    url: request.url,
                    headers: request.headers,
                    body: request.body,
                    auth: request.auth,
                  },
            );
            const updated = await loadCollections();
            setCollections(updated);
            setSaveStatus('saved');
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.error('Failed to save request:', message);
            setSaveStatus('error');
          }
        })();
      }
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

  // GraphQL state handlers
  const handleGraphqlUrlChange = useCallback((url: string) => {
    setGraphqlRequest((prev) => ({ ...prev, url }));
  }, []);

  const handleGraphqlQueryChange = useCallback((query: string) => {
    setGraphqlRequest((prev) => ({ ...prev, query }));
  }, []);

  const handleGraphqlVariablesChange = useCallback((variables: string) => {
    setGraphqlRequest((prev) => ({ ...prev, variables }));
  }, []);

  const handleGraphqlHeadersChange = useCallback((headers: Record<string, string>) => {
    setGraphqlRequest((prev) => ({ ...prev, headers }));
  }, []);

  const handleGraphqlAuthChange = useCallback((auth: AuthConfig) => {
    setGraphqlRequest((prev) => ({ ...prev, auth }));
  }, []);

  const handleGraphqlSend = useCallback(async () => {
    if (!graphqlRequest.url || !activeRequestId) return;

    setIsLoading(true);

    try {
      const result = await sendGraphQLRequest(graphqlRequest);
      setGraphqlResponses((prev) => ({ ...prev, [activeRequestId]: result }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setGraphqlResponses((prev) => ({
        ...prev,
        [activeRequestId]: {
          status: 0,
          statusText: 'ERROR',
          body: `Error: ${errorMessage}`,
          headers: {},
          time: 0,
        },
      }));
    } finally {
      setIsLoading(false);
    }
  }, [graphqlRequest, activeRequestId]);

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
    if (!request.url || !activeRequestId) return;

    setIsLoading(true);

    try {
      const streamResult = await sendRequestWithStreaming(request, {
        onOpen: (initial) => {
          setIsLoading(false);
          const isSSE = (initial.headers['content-type'] ?? '').includes('text/event-stream');
          if (isSSE) {
            setRestResponses((prev) => ({
              ...prev,
              [activeRequestId]: {
                ...initial,
                body: '(streaming)',
                mode: 'sse',
                isStreaming: true,
                streamStartedAt: Date.now(),
                streamEventCount: 0,
                sseEvents: [],
                sseMeta: { droppedEvents: 0 },
              },
            }));
          }
        },
        onEvent: (event) => {
          setRestResponses((prev) => {
            const current = prev[activeRequestId];
            if (!current || current.mode !== 'sse') return prev;
            const events = [...(current.sseEvents ?? []), event];
            const dropped = Math.max(0, events.length - SSE_MAX_EVENTS);
            const nextEvents = dropped > 0 ? events.slice(dropped) : events;
            return {
              ...prev,
              [activeRequestId]: {
                ...current,
                sseEvents: nextEvents,
                streamEventCount: (current.streamEventCount ?? 0) + 1,
                sseMeta: {
                  ...current.sseMeta,
                  lastEventId: event.id,
                  retryMs: event.retry,
                  droppedEvents: (current.sseMeta?.droppedEvents ?? 0) + dropped,
                },
                time: Date.now() - (current.streamStartedAt ?? Date.now()),
              },
            };
          });
        },
        onError: (message) => {
          setIsLoading(false);
          setRestResponses((prev) => {
            const current = prev[activeRequestId];
            if (!current) return prev;
            return {
              ...prev,
              [activeRequestId]: {
                ...current,
                body: `Error: ${message}`,
                isStreaming: false,
                streamEndedAt: Date.now(),
              },
            };
          });
        },
        onComplete: () => {
          setRestResponses((prev) => {
            const current = prev[activeRequestId];
            if (!current || current.mode !== 'sse') return prev;
            return {
              ...prev,
              [activeRequestId]: {
                ...current,
                isStreaming: false,
                streamEndedAt: Date.now(),
                time: Date.now() - (current.streamStartedAt ?? Date.now()),
              },
            };
          });
        },
      });

      setRestStreamControllers((prev) => ({ ...prev, [activeRequestId]: streamResult.controller }));

      setRestResponses((prev) => {
        const current = prev[activeRequestId];
        if (current?.mode === 'sse') {
          return {
            ...prev,
            [activeRequestId]: {
              ...current,
              body: streamResult.response.body,
              headers: streamResult.response.headers,
              status: streamResult.response.status,
              statusText: streamResult.response.statusText,
              time: streamResult.response.time,
              isStreaming: false,
              streamEndedAt: Date.now(),
            },
          };
        }
        return { ...prev, [activeRequestId]: streamResult.response };
      });
      setRestStreamControllers((prev) => {
        const next = { ...prev };
        delete next[activeRequestId];
        return next;
      });
    } catch (error) {
      setIsLoading(false);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setRestResponses((prev) => ({
        ...prev,
        [activeRequestId]: {
          status: 0,
          statusText: 'ERROR',
          body: `Error: ${errorMessage}`,
          headers: {},
          time: 0,
        },
      }));
    } finally {
      setIsLoading(false);
    }
  }, [request, activeRequestId]);

  const handleDisconnectStream = useCallback(() => {
    if (!activeRequestId) return;
    const controller = restStreamControllers[activeRequestId];
    controller?.disconnect();
    setRestResponses((prev) => {
      const current = prev[activeRequestId];
      if (!current) return prev;
      return {
        ...prev,
        [activeRequestId]: {
          ...current,
          isStreaming: false,
          streamEndedAt: Date.now(),
        },
      };
    });
    setRestStreamControllers((prev) => {
      const next = { ...prev };
      delete next[activeRequestId];
      return next;
    });
    setIsLoading(false);
  }, [activeRequestId, restStreamControllers]);

  const handleClearStream = useCallback(() => {
    if (!activeRequestId) return;
    setRestResponses((prev) => {
      const current = prev[activeRequestId];
      if (!current || current.mode !== 'sse') return prev;
      return {
        ...prev,
        [activeRequestId]: {
          ...current,
          sseEvents: [],
          streamEventCount: 0,
          sseMeta: { ...current.sseMeta, droppedEvents: 0 },
        },
      };
    });
  }, [activeRequestId]);

  const handleLoadRequest = useCallback(
    (item: RequestItem, collectionId: string) => {
      const collection = collections.find((c) => c.id === collectionId);
      if (collection?.protocol === 'graphql') {
        setGraphqlRequest({
          url: item.url,
          query: item.body ?? '',
          variables: item.variables ?? '',
          headers: item.headers ?? {},
          auth: item.auth,
        });
      } else {
        setRequest({
          method: item.method,
          url: item.url,
          headers: item.headers ?? {},
          body: item.body ?? '',
          auth: item.auth,
        });
      }
      setRequestName(item.name);
      setActiveRequestId(item.id);
      setActiveCollectionId(collectionId);
    },
    [collections],
  );

  const handleSelectCollection = useCallback((id: string | null) => {
    setActiveCollectionId(id);
    setActiveRequestId(null);
  }, []);

  const handleDeleteItem = useCallback(async (collectionId: string, requestId?: string) => {
    if (requestId) {
      await deleteRequest(collectionId, requestId);
    } else {
      await deleteCollection(collectionId);
    }
    const updated = await loadCollections();
    setCollections(updated);
  }, []);

  return (
    <box
      style={{
        flexDirection: 'row',
        height: '100%',
        backgroundColor: colors.bg.app,
        padding: 1,
        gap: 1,
      }}
    >
      <box
        width={isCollectionCollapsed ? '5%' : '20%'}
        style={{ flexDirection: 'column', height: '100%' }}
      >
        <CollectionPanel
          focused={isFocused('collections') && !collectionModal && !activeModal}
          onFocus={() => setFocus('collections')}
          isCollapsed={isCollectionCollapsed}
          onToggleCollapse={() => setIsCollectionCollapsed((prev) => !prev)}
          collections={collections}
          onLoadRequest={handleLoadRequest}
          onSelectCollection={handleSelectCollection}
          onOpenImportModal={() => {
            setFocus(null);
            setNewCollectionName('');
            setCollectionModalMode('new');
            setCollectionModal('import');
          }}
          onOpenAddModal={(collectionId: string) => {
            setActiveCollectionId(collectionId);
            setNewRequestMethod('GET');
            setNewRequestName('');
            setCurlText('');
            setCollectionModal('add');
          }}
          onDeleteItem={handleDeleteItem}
        />
      </box>

      <box
        style={{
          flexDirection: 'column',
          height: '100%',
          width: isCollectionCollapsed ? '95%' : '80%',
          backgroundColor: colors.bg.app,
          // padding: 1,
        }}
      >
        <box style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1 }}>
          <text fg={colors.accent.primary}>
            <strong>Mailman v0.1.5</strong>
          </text>
          <text fg={colors.text.muted}>
            Ctrl+Q to quit • Ctrl+T for theme • Ctrl+S to save • Ctrl+G for help
          </text>
        </box>

        {activeRequestId ? (
          currentProtocol === 'graphql' ? (
            <box style={{ flexDirection: 'row', height: '100%' }} key={activeRequestId}>
              <box width="50%" style={{ flexDirection: 'column' }}>
                <GraphQLRequestPanel
                  focused={isFocused('request')}
                  onFocus={() => setFocus('request')}
                  url={graphqlRequest.url}
                  onUrlChange={handleGraphqlUrlChange}
                  query={graphqlRequest.query}
                  onQueryChange={handleGraphqlQueryChange}
                  variables={graphqlRequest.variables}
                  onVariablesChange={handleGraphqlVariablesChange}
                  headers={graphqlRequest.headers}
                  onHeadersChange={handleGraphqlHeadersChange}
                  auth={graphqlRequest.auth}
                  onAuthChange={handleGraphqlAuthChange}
                  onSend={handleGraphqlSend}
                  onOpenHeaders={() => setActiveModal('headers')}
                  onOpenAuth={() => setActiveModal('auth')}
                  requestName={requestName}
                  saveStatus={saveStatus}
                />
              </box>
              <box width="50%" style={{ flexDirection: 'column' }}>
                <GraphQLResponsePanel
                  focused={isFocused('response')}
                  onFocus={() => setFocus('response')}
                  response={currentGraphqlResponse}
                  isExpanded={showResponseModal}
                  onToggleExpand={setShowResponseModal}
                />
              </box>
            </box>
          ) : (
            <>
              <box height="35%" style={{ flexDirection: 'column' }}>
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
                  requestName={requestName}
                  saveStatus={saveStatus}
                />
              </box>

              <box height="65%" style={{ flexDirection: 'column', marginTop: 1 }}>
                <ResponsePanel
                  focused={isFocused('response')}
                  onFocus={() => setFocus('response')}
                  response={currentResponse}
                  isExpanded={showResponseModal}
                  onToggleExpand={setShowResponseModal}
                  onDisconnectStream={handleDisconnectStream}
                  onClearStream={handleClearStream}
                />
              </box>
            </>
          )
        ) : (
          <box style={{ flexDirection: 'column', flexGrow: 1 }}>
            <WelcomePanel
              collection={
                activeCollectionId
                  ? collections.find((c) => c.id === activeCollectionId)
                  : undefined
              }
              onExportCollection={() => {
                setCollectionModal('export');
              }}
            />
          </box>
        )}

        {isLoading && (
          <box
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              backgroundColor: colors.bg.panel,
              border: true,
              borderColor: colors.accent.primary,
              padding: 1,
            }}
          >
            <text fg={colors.accent.primary}>Loading...</text>
          </box>
        )}

        {/* Modal popups for editors - rendered at App level for full screen sizing */}
        {activeModal === 'headers' && (
          <Modal isOpen={true} onClose={() => setActiveModal(null)} title="Headers">
            <HeadersEditor
              headers={
                currentProtocol === 'graphql' ? graphqlRequest.headers : (request.headers ?? {})
              }
              onHeadersChange={
                currentProtocol === 'graphql' ? handleGraphqlHeadersChange : handleHeadersChange
              }
            />
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
            <AuthEditor
              auth={currentProtocol === 'graphql' ? graphqlRequest.auth : request.auth}
              onAuthChange={
                currentProtocol === 'graphql' ? handleGraphqlAuthChange : handleAuthChange
              }
            />
          </Modal>
        )}

        {/* Collection Modals - rendered at App level for full screen sizing */}
        {collectionModal === 'import' && (
          <Modal
            isOpen={true}
            onClose={() => {
              setCollectionModal(null);
              setImportError(null);
            }}
            title="Collection"
          >
            <box style={{ flexDirection: 'column', gap: 1, padding: 1, height: '100%' }}>
              <box style={{ flexDirection: 'row', gap: 1 }}>
                <box
                  style={{
                    border: true,
                    borderColor:
                      collectionModalMode === 'new' ? colors.accent.primary : colors.border.default,
                    paddingLeft: 2,
                    paddingRight: 2,
                  }}
                  onMouseDown={() => setCollectionModalMode('new')}
                >
                  <text
                    fg={collectionModalMode === 'new' ? colors.accent.primary : colors.text.muted}
                    style={{ paddingTop: 0.5, paddingBottom: 0.5 }}
                  >
                    New
                  </text>
                </box>
                <box
                  style={{
                    border: true,
                    borderColor:
                      collectionModalMode === 'import'
                        ? colors.accent.primary
                        : colors.border.default,
                    paddingLeft: 2,
                    paddingRight: 2,
                  }}
                  onMouseDown={() => setCollectionModalMode('import')}
                >
                  <text
                    fg={
                      collectionModalMode === 'import' ? colors.accent.primary : colors.text.muted
                    }
                    style={{ paddingTop: 0.5, paddingBottom: 0.5 }}
                  >
                    Import
                  </text>
                </box>
              </box>

              {collectionModalMode === 'new' ? (
                <box style={{ flexDirection: 'column', gap: 1 }}>
                  <box style={{ flexDirection: 'row', gap: 1 }}>
                    <box
                      style={{
                        border: true,
                        borderColor:
                          newCollectionProtocol === 'rest'
                            ? colors.accent.primary
                            : colors.border.default,
                        paddingLeft: 2,
                        paddingRight: 2,
                      }}
                      onMouseDown={() => setNewCollectionProtocol('rest')}
                    >
                      <text
                        fg={
                          newCollectionProtocol === 'rest'
                            ? colors.accent.primary
                            : colors.text.muted
                        }
                      >
                        REST
                      </text>
                    </box>
                    <box
                      style={{
                        border: true,
                        borderColor:
                          newCollectionProtocol === 'graphql'
                            ? colors.accent.primary
                            : colors.border.default,
                        paddingLeft: 2,
                        paddingRight: 2,
                      }}
                      onMouseDown={() => setNewCollectionProtocol('graphql')}
                    >
                      <text
                        fg={
                          newCollectionProtocol === 'graphql'
                            ? colors.accent.primary
                            : colors.text.muted
                        }
                      >
                        GRAPHQL
                      </text>
                    </box>
                  </box>

                  <box
                    style={{
                      border: true,
                      borderColor: colors.border.default,
                      borderStyle: 'rounded',
                      paddingLeft: 1,
                    }}
                  >
                    <input
                      placeholder="Collection name..."
                      value={newCollectionName}
                      onInput={(val: string) => setNewCollectionName(val)}
                      focused={true}
                    />
                  </box>
                  <box style={{ flexDirection: 'row', gap: 1, marginTop: 1 }}>
                    <box
                      style={{
                        border: true,
                        borderColor: colors.accent.primary,
                        borderStyle: 'rounded',
                        paddingLeft: 2,
                        paddingRight: 2,
                      }}
                      onMouseDown={() => {
                        if (newCollectionName.trim()) {
                          void (async () => {
                            await addCollection(newCollectionName.trim(), newCollectionProtocol);
                            const updated = await loadCollections();
                            setCollections(updated);
                          })();
                          setCollectionModal(null);
                          setNewCollectionName('');
                          setNewCollectionProtocol('rest');
                        }
                      }}
                    >
                      <text fg={colors.accent.primary}>Create</text>
                    </box>
                    <box
                      style={{
                        border: true,
                        borderColor: colors.border.default,
                        borderStyle: 'rounded',
                        paddingLeft: 2,
                        paddingRight: 2,
                      }}
                      onMouseDown={() => {
                        setCollectionModal(null);
                        setNewCollectionName('');
                        setNewCollectionProtocol('rest');
                      }}
                    >
                      <text fg={colors.text.muted}>Cancel</text>
                    </box>
                  </box>
                </box>
              ) : (
                <FileBrowser
                  startPath="~"
                  fileFilter={(item) => item.isDirectory || item.name.endsWith('.json')}
                  onSelectFile={(path) => {
                    void (async () => {
                      try {
                        const imported = await importCollectionsFromFile(path);
                        if (!imported.length) throw new Error('No collections found');
                        const existing = await loadCollections();
                        await saveCollections([...existing, ...imported]);
                        setCollections(await loadCollections());
                        setCollectionModal(null);
                        setImportError(null);
                      } catch (e) {
                        setImportError(e instanceof Error ? e.message : String(e));
                      }
                    })();
                  }}
                  onCancel={() => setCollectionModal(null)}
                />
              )}
              {importError && <text fg={colors.syntax.error}>{importError}</text>}
            </box>
          </Modal>
        )}

        {collectionModal === 'add' && activeCollectionId && (
          <Modal isOpen={true} onClose={() => setCollectionModal(null)} title="Add Request">
            <box style={{ flexDirection: 'column', gap: 1, padding: 1 }}>
              <box style={{ flexDirection: 'row', gap: 1, alignItems: 'center' }}>
                <text fg={colors.text.muted}>Method:</text>
                {activeCollection?.protocol === 'graphql' ? (
                  <text fg={colors.accent.primary}>GRAPHQL</text>
                ) : (
                  <box
                    style={{
                      border: true,
                      borderColor: colors.border.default,
                      borderStyle: 'rounded',
                      paddingLeft: 1,
                      paddingRight: 1,
                    }}
                    onMouseDown={() => {
                      const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
                      const idx = METHODS.indexOf(newRequestMethod);
                      setNewRequestMethod(METHODS[(idx + 1) % METHODS.length]!);
                    }}
                  >
                    <text
                      fg={
                        colors.methods[newRequestMethod as keyof typeof colors.methods]?.text ??
                        colors.text.primary
                      }
                    >
                      {newRequestMethod}
                    </text>
                  </box>
                )}
              </box>

              <box
                style={{
                  border: true,
                  borderColor: colors.border.default,
                  borderStyle: 'rounded',
                  paddingLeft: 1,
                }}
              >
                <input
                  placeholder="Request name..."
                  value={newRequestName}
                  onInput={(val: string) => setNewRequestName(val)}
                  focused={true}
                />
              </box>

              <text fg={colors.text.muted}>Quick Curl (Optional):</text>
              <box
                style={{
                  border: true,
                  borderColor: colors.border.default,
                  borderStyle: 'rounded',
                  paddingLeft: 1,
                  height: 6,
                }}
              >
                <input
                  placeholder={`curl -X GET https://api.example.com -H "Accept: application/json"`}
                  value={curlText}
                  onInput={(val: string) => setCurlText(val)}
                />
              </box>

              <box style={{ flexDirection: 'row', gap: 1, marginTop: 1 }}>
                <box
                  style={{
                    border: true,
                    borderColor: colors.accent.primary,
                    borderStyle: 'rounded',
                    paddingLeft: 2,
                    paddingRight: 2,
                  }}
                  onMouseDown={() => {
                    if (newRequestName.trim() && activeCollectionId) {
                      let method = newRequestMethod;
                      let url = '';
                      let headers: Record<string, string> | undefined;
                      let body: string | undefined;
                      let variables: string | undefined;

                      if (curlText.trim()) {
                        try {
                          const parsed = parseCurl(curlText.trim());
                          method = parsed.method;
                          url = parsed.url;
                          if (Object.keys(parsed.headers).length > 0) {
                            headers = parsed.headers;
                          }
                          if (parsed.protocol === 'graphql') {
                            body = parsed.query;
                            variables = parsed.variables || undefined;
                          } else if (parsed.body) {
                            body = parsed.body;
                          }
                        } catch {
                          // parsing failed, falls through to use manual method
                        }
                      }

                      void (async () => {
                        await addRequestToCollection(activeCollectionId, {
                          method,
                          name: newRequestName.trim(),
                          url,
                          headers,
                          body,
                          variables,
                        });
                        const updated = await loadCollections();
                        setCollections(updated);
                      })();
                      setCollectionModal(null);
                      setNewRequestName('');
                      setNewRequestMethod('GET');
                      setCurlText('');
                    }
                  }}
                >
                  <text fg={colors.accent.primary}>Add</text>
                </box>
                <box
                  style={{
                    border: true,
                    borderColor: colors.border.default,
                    borderStyle: 'rounded',
                    paddingLeft: 2,
                    paddingRight: 2,
                  }}
                  onMouseDown={() => {
                    setCollectionModal(null);
                    setNewRequestName('');
                    setNewRequestMethod('GET');
                    setCurlText('');
                  }}
                >
                  <text fg={colors.text.muted}>Cancel</text>
                </box>
              </box>
            </box>
          </Modal>
        )}

        {collectionModal === 'export' && (
          <Modal isOpen={true} onClose={() => setCollectionModal(null)} title="Export Collection">
            <box style={{ flexDirection: 'column', gap: 1, padding: 1 }} />
          </Modal>
        )}
        {/* Response Expanded Modal - rendered at App level for full screen sizing */}
        {showResponseModal && currentResponse && (
          <ResponseModal response={currentResponse} onClose={() => setShowResponseModal(false)} />
        )}
        {/* Catalog Help Modal */}
        {showHelp && (
          <Modal isOpen={true} onClose={() => setShowHelp(false)} title="Help">
            <CatalogPanel onClose={() => setShowHelp(false)} />
          </Modal>
        )}
        {/* Theme Selector Modal */}
        <ThemeSelector isOpen={showThemeSelector} onClose={() => setShowThemeSelector(false)} />
      </box>
    </box>
  );
}
