import { useState, useCallback, useEffect, useMemo } from 'react';
import { useFocus, useKeyboardShortcuts } from './hooks';
import {
  RequestPanel,
  ResponsePanel,
  CollectionPanel,
  Modal,
  Notification,
  ResponseModal,
  WelcomePanel,
  CatalogPanel,
  GraphQLRequestPanel,
  GraphQLResponsePanel,
  WebSocketRequestPanel,
  WebSocketResponsePanel,
  HistoryModal,
  RequestStatsModal,
  ScriptsEditor,
  CollectionImportView,
  RequestAddingView,
} from './components';
import { HeadersEditor } from './components/HeadersEditor';
import { BodyEditor } from './components/BodyEditor';
import { QueryParamsEditor } from './components/QueryParamsEditor';
import { AuthEditor } from './components/AuthEditor';
import { ThemeSelector } from './components/ThemeSelector';
import { useTheme } from '../../shared/theme/ThemeProvider';
import type { NotificationAction, NotificationVariant } from './components';
import {
  sendRequest,
  sendRequestWithStreaming,
  sendGraphQLRequest,
  loadCollections,
  updateRequest,
  deleteCollection,
  deleteRequest,
  loadHistory,
  appendHistoryEntry,
  connectWebSocket,
  createProtocolMessage,
} from '../../core/services';
import {
  copyTextToClipboard,
  getGraphqlTabCopyContent,
  getRestTabCopyContent,
} from '../../shared/utils/responseCopyUtility';
import { getInstructionContextKey, INSTRUCTION_CATALOG } from './utils/instructions';
import type {
  GraphqlResponseTab,
  RestResponseTab,
  SseResponseTab,
} from '../../shared/utils/responseCopyUtility';
import type {
  HistoryEntry,
  RequestOptions,
  RequestScripts,
  ResponseState,
  AuthConfig,
  Collection,
  RequestItem,
  FocusArea,
  ProtocolController,
  ProtocolMessage,
} from '../../core/types';
type Tab = 'headers' | 'body' | 'query' | 'auth' | 'scripts';

type AppNotification = {
  title: string;
  message?: string;
  variant?: NotificationVariant;
  actions?: NotificationAction[];
};

export function App() {
  const { setFocus, isFocused, focusedArea } = useFocus();
  const { colors } = useTheme();
  const [request, setRequest] = useState<RequestOptions>({
    method: 'GET',
    url: '',
    headers: {},
    body: '',
    scripts: {},
  });
  const [graphqlRequest, setGraphqlRequest] = useState<{
    url: string;
    query: string;
    variables: string;
    headers: Record<string, string>;
    auth?: AuthConfig;
    scripts?: RequestScripts;
  }>({
    url: '',
    query: '',
    variables: '',
    headers: {},
    scripts: {},
  });
  const [restResponses, setRestResponses] = useState<Record<string, ResponseState>>({});
  const [restStreamControllers, setRestStreamControllers] = useState<
    Record<string, { disconnect: () => void }>
  >({});
  const [graphqlResponses, setGraphqlResponses] = useState<Record<string, ResponseState>>({});
  const [websocketResponses, setWebsocketResponses] = useState<Record<string, ResponseState>>({});
  const [websocketControllers, setWebsocketControllers] = useState<
    Record<string, ProtocolController>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [isCollectionCollapsed, setIsCollectionCollapsed] = useState(false);
  const [activeModal, setActiveModal] = useState<Tab | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [requestName, setRequestName] = useState<string>('');

  const [collectionModal, setCollectionModal] = useState<'import' | 'add' | 'export' | null>(null);
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [restActiveTab, setRestActiveTab] = useState<RestResponseTab>('body');
  const [restActiveSseTab, setRestActiveSseTab] = useState<SseResponseTab>('events');
  const [graphqlActiveTab, setGraphqlActiveTab] = useState<GraphqlResponseTab>('body');
  const [modalActiveTab, setModalActiveTab] = useState<RestResponseTab>('body');

  const currentResponse = activeRequestId ? (restResponses[activeRequestId] ?? null) : null;
  const currentGraphqlResponse = activeRequestId
    ? (graphqlResponses[activeRequestId] ?? null)
    : null;
  const currentWebSocketResponse = activeRequestId
    ? (websocketResponses[activeRequestId] ?? null)
    : null;

  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showRequestStatsModal, setShowRequestStatsModal] = useState(false);
  const [notification, setNotification] = useState<AppNotification | null>(null);
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const SSE_MAX_EVENTS = 500;
  const activeCollection = activeCollectionId
    ? collections.find((c) => c.id === activeCollectionId)
    : undefined;
  const activeRequest = activeCollection?.requests.find((item) => item.id === activeRequestId);
  const currentProtocol = activeRequest?.protocol ?? 'rest';
  const isStreamingResponse =
    currentResponse?.mode === 'sse' && (currentResponse.isStreaming ?? false);

  const instructionContextKey = useMemo(
    () =>
      getInstructionContextKey({
        showHelp,
        showThemeSelector,
        showHistoryModal,
        showResponseModal,
        showRequestStatsModal,
        activeModal,
        collectionModal,
        isLoading,
        currentProtocol,
        isStreamingResponse,
        activeRequestId,
        focusedArea,
        activeCollectionId,
      }),
    [
      showHelp,
      showThemeSelector,
      showHistoryModal,
      showResponseModal,
      showRequestStatsModal,
      activeModal,
      collectionModal,
      isLoading,
      currentProtocol,
      isStreamingResponse,
      activeRequestId,
      focusedArea,
      activeCollectionId,
    ],
  );

  const [instructionIndex, setInstructionIndex] = useState(0);
  const [isInstructionAnimating, setIsInstructionAnimating] = useState(false);
  const currentInstructionQueue =
    INSTRUCTION_CATALOG[instructionContextKey] ?? INSTRUCTION_CATALOG['idle.noCollection'];

  useEffect(() => {
    setInstructionIndex(0);
  }, [instructionContextKey]);

  useEffect(() => {
    if (currentInstructionQueue.length <= 1) return;
    const timer = setInterval(() => {
      setInstructionIndex((prev) => (prev + 1) % currentInstructionQueue.length);
    }, 3200);
    return () => clearInterval(timer);
  }, [currentInstructionQueue]);

  useEffect(() => {
    setIsInstructionAnimating(true);
    const timer = setTimeout(() => setIsInstructionAnimating(false), 450);
    return () => clearTimeout(timer);
  }, [instructionContextKey, instructionIndex]);

  const liveInstruction =
    currentInstructionQueue[instructionIndex] ?? INSTRUCTION_CATALOG['idle.noCollection'][0];

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
    if (copyStatus !== 'idle') {
      const timer = setTimeout(() => setCopyStatus('idle'), 2000);
      return () => clearTimeout(timer);
    }
  }, [copyStatus]);

  useEffect(() => {
    return () => {
      Object.values(restStreamControllers).forEach((controller) => controller.disconnect());
      Object.values(websocketControllers).forEach((controller) => controller.disconnect());
    };
  }, [restStreamControllers, websocketControllers]);

  const handleQuit = useCallback(() => {
    const cleanExit = (globalThis as any).__mailmanCleanExit;
    if (cleanExit) cleanExit();
  }, []);

  const closeActiveOverlayForFocusChange = useCallback(() => {
    if (activeModal) {
      setActiveModal(null);
      return;
    }

    if (collectionModal) {
      setCollectionModal(null);
      return;
    }

    if (showHelp) {
      setShowHelp(false);
      return;
    }

    if (showHistoryModal) {
      setShowHistoryModal(false);
      setHistoryError(null);
      return;
    }

    if (showResponseModal) {
      setShowResponseModal(false);
      return;
    }

    if (showRequestStatsModal) {
      setShowRequestStatsModal(false);
      return;
    }

    if (notification) {
      setNotification(null);
      return;
    }

    if (showThemeSelector) {
      setShowThemeSelector(false);
    }
  }, [
    activeModal,
    collectionModal,
    showHelp,
    showHistoryModal,
    showResponseModal,
    showRequestStatsModal,
    notification,
    showThemeSelector,
  ]);

  const handleFocusArea = useCallback(
    (area: FocusArea) => {
      closeActiveOverlayForFocusChange();
      setFocus(area);
    },
    [closeActiveOverlayForFocusChange, setFocus],
  );

  const handleOpenHistory = useCallback(() => {
    void (async () => {
      const entries = await loadHistory();
      setHistoryEntries(entries);
    })();
  }, []);

  const handleSaveRequest = useCallback(() => {
    if (!activeRequestId || !activeCollectionId) return;

    void (async () => {
      try {
        await updateRequest(
          activeCollectionId,
          activeRequestId,
          currentProtocol === 'graphql'
            ? {
                protocol: 'graphql',
                name: requestName,
                url: graphqlRequest.url,
                query: graphqlRequest.query,
                variables: graphqlRequest.variables,
                headers: graphqlRequest.headers,
                auth: graphqlRequest.auth,
                scripts: graphqlRequest.scripts,
              }
            : currentProtocol === 'websocket'
              ? {
                  protocol: 'websocket',
                  name: requestName,
                  url: request.url,
                  headers: request.headers ?? {},
                  initialMessage: request.body ?? '',
                }
              : {
                  protocol: 'rest',
                  name: requestName,
                  method: request.method,
                  url: request.url,
                  headers: request.headers ?? {},
                  body: request.body ?? '',
                  auth: request.auth,
                  scripts: request.scripts,
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
  }, [
    activeCollectionId,
    activeRequestId,
    currentProtocol,
    graphqlRequest,
    request.auth,
    request.body,
    request.headers,
    request.method,
    request.scripts,
    request.url,
    requestName,
  ]);

  const handleCopyResponse = useCallback(() => {
    const canCopy = focusedArea === 'response' || showResponseModal;
    if (!canCopy || !activeRequestId) return;

    const responseToCopy =
      currentProtocol === 'graphql'
        ? currentGraphqlResponse
        : (currentResponse ?? restResponses[activeRequestId] ?? null);

    if (!responseToCopy) return;

    const content = showResponseModal
      ? getRestTabCopyContent(responseToCopy, modalActiveTab, restActiveSseTab)
      : currentProtocol === 'graphql'
        ? getGraphqlTabCopyContent(responseToCopy, graphqlActiveTab)
        : getRestTabCopyContent(responseToCopy, restActiveTab, restActiveSseTab);

    void (async () => {
      const copied = await copyTextToClipboard(content);
      if (!copied) {
        console.error('Failed to copy response content to clipboard.');
        setCopyStatus('error');
        return;
      }
      setCopyStatus('copied');
    })();
  }, [
    activeRequestId,
    currentGraphqlResponse,
    currentProtocol,
    currentResponse,
    focusedArea,
    graphqlActiveTab,
    modalActiveTab,
    restActiveSseTab,
    restActiveTab,
    restResponses,
    showResponseModal,
  ]);

  useKeyboardShortcuts(
    {
      showThemeSelector,
      showHelp,
      showHistoryModal,
      showResponseModal,
      showRequestStatsModal,
      showNotification: Boolean(notification),
      activeModal,
      collectionModal,
      hasActiveRequest: Boolean(activeRequestId),
      hasActiveCollection: Boolean(activeCollectionId),
      canCopyResponse: focusedArea === 'response' || showResponseModal,
    },
    {
      setShowThemeSelector,
      setShowHelp,
      setShowHistoryModal,
      setShowResponseModal,
      setShowRequestStatsModal,
      setShowNotification: (show: boolean) => {
        if (!show) setNotification(null);
      },
      setActiveModal,
      setCollectionModal,
      resetHistoryError: () => setHistoryError(null),
      onQuit: handleQuit,
      onOpenHistory: handleOpenHistory,
      onSaveRequest: handleSaveRequest,
      onCopyResponse: handleCopyResponse,
    },
  );

  const addRestHistoryEntry = useCallback(
    (response: ResponseState) => {
      if (!activeRequestId) return;
      void appendHistoryEntry({
        protocol: 'rest',
        collectionId: activeCollectionId ?? undefined,
        requestId: activeRequestId,
        requestName: requestName || undefined,
        request: {
          method: request.method,
          url: request.url,
          headers: request.headers ?? {},
          body: request.body,
          auth: request.auth,
          scripts: request.scripts,
        },
        response: {
          status: response.status,
          statusText: response.statusText,
          body: response.body,
          headers: response.headers,
          time: response.time,
          stats: response.stats,
          mode: response.mode,
          scriptResults: response.scriptResults,
          sseSummary:
            response.mode === 'sse'
              ? {
                  eventCount: response.streamEventCount ?? 0,
                  droppedEvents: response.sseMeta?.droppedEvents ?? 0,
                  durationMs:
                    response.streamEndedAt && response.streamStartedAt
                      ? Math.max(0, response.streamEndedAt - response.streamStartedAt)
                      : response.time,
                }
              : undefined,
        },
      });
    },
    [activeCollectionId, activeRequestId, currentProtocol, request, requestName],
  );

  const addGraphqlHistoryEntry = useCallback(
    (response: ResponseState) => {
      if (!activeRequestId) return;
      void appendHistoryEntry({
        protocol: 'graphql',
        collectionId: activeCollectionId ?? undefined,
        requestId: activeRequestId,
        requestName: requestName || undefined,
        request: {
          method: 'POST',
          url: graphqlRequest.url,
          headers: graphqlRequest.headers,
          body: graphqlRequest.query,
          variables: graphqlRequest.variables,
          auth: graphqlRequest.auth,
          scripts: graphqlRequest.scripts,
        },
        response: {
          status: response.status,
          statusText: response.statusText,
          body: response.body,
          headers: response.headers,
          time: response.time,
          stats: response.stats,
          mode: response.mode,
          scriptResults: response.scriptResults,
        },
      });
    },
    [activeCollectionId, activeRequestId, graphqlRequest, requestName],
  );

  const addWebSocketHistoryEntry = useCallback(
    (response: ResponseState) => {
      if (!activeRequestId) return;
      const startedAt = response.streamStartedAt ?? Date.now();
      const endedAt = response.streamEndedAt ?? Date.now();
      const durationMs = Math.max(0, endedAt - startedAt);
      const messageCount = response.messages?.length ?? 0;
      void appendHistoryEntry({
        protocol: 'websocket',
        collectionId: activeCollectionId ?? undefined,
        requestId: activeRequestId,
        requestName: requestName || undefined,
        request: {
          method: 'WEBSOCKET',
          url: request.url,
          headers: request.headers ?? {},
          body: request.body,
        },
        response: {
          status: response.status,
          statusText: response.statusText,
          body: `${messageCount} messages`,
          headers: response.headers,
          time: response.time || durationMs,
          mode: 'websocket',
          messageSummary: {
            messageCount,
            durationMs,
          },
        },
      });
    },
    [activeCollectionId, activeRequestId, request.body, request.headers, request.url, requestName],
  );

  const openFromHistory = useCallback(
    (entry: HistoryEntry) => {
      if (!entry.collectionId || !entry.requestId) {
        setHistoryError('Selected history item is missing request reference.');
        return;
      }

      const collection = collections.find((item) => item.id === entry.collectionId);
      const matchedRequest = collection?.requests.find((item) => item.id === entry.requestId);

      if (!collection || !matchedRequest) {
        setHistoryError('Original request no longer exists. Cannot open from history.');
        return;
      }

      setActiveCollectionId(collection.id);
      setActiveRequestId(matchedRequest.id);
      setRequestName(entry.requestName || matchedRequest.name);

      if (entry.protocol === 'graphql') {
        setGraphqlRequest({
          url: entry.request.url,
          query: entry.request.body ?? '',
          variables: entry.request.variables ?? '',
          headers: entry.request.headers,
          auth: entry.request.auth,
          scripts: entry.request.scripts,
        });
        setGraphqlResponses((prev) => ({ ...prev, [matchedRequest.id]: entry.response }));
      } else if (entry.protocol === 'websocket') {
        setRequest({
          method: 'WEBSOCKET',
          url: entry.request.url,
          headers: entry.request.headers,
          body: entry.request.body ?? '',
          auth: entry.request.auth,
        });
        setWebsocketResponses((prev) => ({ ...prev, [matchedRequest.id]: entry.response }));
      } else {
        setRequest({
          method: entry.request.method,
          url: entry.request.url,
          headers: entry.request.headers,
          body: entry.request.body ?? '',
          auth: entry.request.auth,
          scripts: entry.request.scripts,
        });
        setRestResponses((prev) => ({ ...prev, [matchedRequest.id]: entry.response }));
      }

      setHistoryError(null);
      setShowHistoryModal(false);
    },
    [collections],
  );

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

  const handleScriptsChange = useCallback((scripts: RequestScripts) => {
    setRequest((prev) => ({ ...prev, scripts }));
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

  const handleGraphqlScriptsChange = useCallback((scripts: RequestScripts) => {
    setGraphqlRequest((prev) => ({ ...prev, scripts }));
  }, []);

  const handleGraphqlSend = useCallback(async () => {
    if (!graphqlRequest.url || !activeRequestId) return;

    setIsLoading(true);

    try {
      const result = await sendGraphQLRequest(graphqlRequest);
      if (result.updatedAuth) {
        setGraphqlRequest((prev) => ({ ...prev, auth: result.updatedAuth }));
      }
      setGraphqlResponses((prev) => ({ ...prev, [activeRequestId]: result }));
      addGraphqlHistoryEntry(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorResponse: ResponseState = {
        status: 0,
        statusText: 'ERROR',
        body: `Error: ${errorMessage}`,
        headers: {},
        time: 0,
      };
      setGraphqlResponses((prev) => ({
        ...prev,
        [activeRequestId]: errorResponse,
      }));
      addGraphqlHistoryEntry(errorResponse);
    } finally {
      setIsLoading(false);
    }
  }, [graphqlRequest, activeRequestId, addGraphqlHistoryEntry]);

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
      if (streamResult.updatedAuth) {
        setRequest((prev) => ({ ...prev, auth: streamResult.updatedAuth }));
      }

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
              stats: streamResult.response.stats,
              isStreaming: false,
              streamEndedAt: Date.now(),
            },
          };
        }
        return { ...prev, [activeRequestId]: streamResult.response };
      });
      addRestHistoryEntry(streamResult.response);
      setRestStreamControllers((prev) => {
        const next = { ...prev };
        delete next[activeRequestId];
        return next;
      });
    } catch (error) {
      setIsLoading(false);
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorResponse: ResponseState = {
        status: 0,
        statusText: 'ERROR',
        body: `Error: ${errorMessage}`,
        headers: {},
        time: 0,
      };
      setRestResponses((prev) => ({
        ...prev,
        [activeRequestId]: errorResponse,
      }));
      addRestHistoryEntry(errorResponse);
    } finally {
      setIsLoading(false);
    }
  }, [request, activeRequestId, addRestHistoryEntry]);

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

  const appendWebSocketMessage = useCallback((requestId: string, message: ProtocolMessage) => {
    setWebsocketResponses((prev) => {
      const current = prev[requestId];
      if (!current) return prev;
      const messages = [...(current.messages ?? []), message];
      const now = Date.now();
      return {
        ...prev,
        [requestId]: {
          ...current,
          messages,
          streamEventCount: messages.length,
          time: now - (current.streamStartedAt ?? now),
        },
      };
    });
  }, []);

  const updateWebSocketResponse = useCallback(
    (requestId: string, updater: (response: ResponseState) => ResponseState) => {
      setWebsocketResponses((prev) => {
        const current = prev[requestId];
        if (!current) return prev;
        return { ...prev, [requestId]: updater(current) };
      });
    },
    [],
  );

  const handleWebSocketConnect = useCallback(() => {
    if (!activeRequestId || !request.url) return;

    const requestId = activeRequestId;
    websocketControllers[requestId]?.disconnect();

    try {
      const result = connectWebSocket(
        {
          url: request.url,
          headers: request.headers ?? {},
          initialMessage: request.body,
        },
        {
          onOpen: () => {
            updateWebSocketResponse(requestId, (current) => ({
              ...current,
              status: 101,
              statusText: 'CONNECTED',
              body: '(connected)',
              isStreaming: true,
              messages: [
                ...(current.messages ?? []),
                createProtocolMessage('system', 'Connected'),
                ...(request.body?.trim()
                  ? [createProtocolMessage('outbound', request.body, { initial: 'true' })]
                  : []),
              ],
            }));
          },
          onMessage: (message) => appendWebSocketMessage(requestId, message),
          onError: (message) => {
            appendWebSocketMessage(requestId, createProtocolMessage('system', message));
            updateWebSocketResponse(requestId, (current) => ({
              ...current,
              statusText: 'ERROR',
              body: message,
              isStreaming: false,
              streamEndedAt: Date.now(),
            }));
          },
          onClose: (code, reason) => {
            const closeMessage = `Closed${code ? ` (${code})` : ''}${reason ? `: ${reason}` : ''}`;
            appendWebSocketMessage(requestId, createProtocolMessage('system', closeMessage));
            updateWebSocketResponse(requestId, (current) => {
              const endedAt = Date.now();
              const closedResponse: ResponseState = {
                ...current,
                statusText: 'CLOSED',
                body: closeMessage,
                isStreaming: false,
                streamEndedAt: endedAt,
                time: endedAt - (current.streamStartedAt ?? endedAt),
              };
              addWebSocketHistoryEntry(closedResponse);
              return closedResponse;
            });
            setWebsocketControllers((prev) => {
              const next = { ...prev };
              delete next[requestId];
              return next;
            });
          },
        },
      );

      setWebsocketResponses((prev) => ({ ...prev, [requestId]: result.response }));
      if (result.controller) {
        setWebsocketControllers((prev) => ({ ...prev, [requestId]: result.controller! }));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setWebsocketResponses((prev) => ({
        ...prev,
        [requestId]: {
          mode: 'websocket',
          status: 0,
          statusText: 'ERROR',
          body: message,
          headers: {},
          time: 0,
          isStreaming: false,
          streamEndedAt: Date.now(),
          messages: [createProtocolMessage('system', message)],
        },
      }));
    }
  }, [
    activeRequestId,
    addWebSocketHistoryEntry,
    appendWebSocketMessage,
    request.body,
    request.headers,
    request.url,
    updateWebSocketResponse,
    websocketControllers,
  ]);

  const handleWebSocketSend = useCallback(() => {
    if (!activeRequestId || !request.body?.trim()) return;
    const controller = websocketControllers[activeRequestId];
    if (!controller?.send) {
      appendWebSocketMessage(
        activeRequestId,
        createProtocolMessage('system', 'WebSocket is not connected'),
      );
      return;
    }
    controller.send(request.body);
    appendWebSocketMessage(activeRequestId, createProtocolMessage('outbound', request.body));
  }, [activeRequestId, appendWebSocketMessage, request.body, websocketControllers]);

  const handleWebSocketDisconnect = useCallback(() => {
    if (!activeRequestId) return;
    websocketControllers[activeRequestId]?.disconnect();
  }, [activeRequestId, websocketControllers]);

  const handleWebSocketClear = useCallback(() => {
    if (!activeRequestId) return;
    setWebsocketResponses((prev) => {
      const current = prev[activeRequestId];
      if (!current) return prev;
      return {
        ...prev,
        [activeRequestId]: {
          ...current,
          messages: [],
          streamEventCount: 0,
        },
      };
    });
  }, [activeRequestId]);

  const handleLoadRequest = useCallback((item: RequestItem, collectionId: string) => {
    if (item.protocol === 'graphql') {
      setGraphqlRequest({
        url: item.url,
        query: item.query,
        variables: item.variables,
        headers: item.headers,
        auth: item.auth,
        scripts: item.scripts,
      });
    } else if (item.protocol === 'websocket') {
      setRequest({
        method: 'CONNECT',
        url: item.url,
        headers: item.headers,
        body: item.initialMessage,
      });
    } else {
      setRequest({
        method: item.method,
        url: item.url,
        headers: item.headers,
        body: item.body,
        auth: item.auth,
        scripts: item.scripts,
      });
    }
    setRequestName(item.name);
    setActiveRequestId(item.id);
    setActiveCollectionId(collectionId);
  }, []);

  const handleSelectCollection = useCallback((id: string | null) => {
    setActiveCollectionId(id);
    setActiveRequestId(null);
  }, []);

  const handleDeleteItem = useCallback(
    (collectionId: string, requestId?: string) => {
      const collection = collections.find((item) => item.id === collectionId);
      const requestItem = requestId
        ? collection?.requests.find((item) => item.id === requestId)
        : undefined;
      const targetName = requestItem?.name || collection?.name || 'selected item';
      const targetType = requestId ? 'request' : 'collection';

      setNotification({
        title: `Delete ${targetType}?`,
        message: `Are you sure you want to delete ${targetName}? This action cannot be undone.`,
        variant: 'warning',
        actions: [
          {
            label: 'No',
            variant: 'secondary',
            onPress: () => setNotification(null),
          },
          {
            label: 'Yes',
            variant: 'danger',
            onPress: () => {
              setNotification(null);
              void (async () => {
                try {
                  if (requestId) {
                    await deleteRequest(collectionId, requestId);
                    if (activeRequestId === requestId) {
                      setActiveRequestId(null);
                    }
                  } else {
                    await deleteCollection(collectionId);
                    if (activeCollectionId === collectionId) {
                      setActiveCollectionId(null);
                      setActiveRequestId(null);
                    }
                  }
                  const updated = await loadCollections();
                  setCollections(updated);
                } catch (error) {
                  const message = error instanceof Error ? error.message : String(error);
                  console.error(`Failed to delete ${targetType}:`, message);
                  setNotification({
                    title: `Delete ${targetType} failed`,
                    message,
                    variant: 'error',
                    actions: [
                      {
                        label: 'OK',
                        variant: 'primary',
                        onPress: () => setNotification(null),
                      },
                    ],
                  });
                }
              })();
            },
          },
        ],
      });
    },
    [activeCollectionId, activeRequestId, collections],
  );

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
          focused={isFocused('collections') && !collectionModal && !activeModal && !notification}
          onFocus={() => handleFocusArea('collections')}
          isCollapsed={isCollectionCollapsed}
          onToggleCollapse={() => setIsCollectionCollapsed((prev) => !prev)}
          collections={collections}
          onLoadRequest={handleLoadRequest}
          onSelectCollection={handleSelectCollection}
          onOpenImportModal={() => {
            setFocus(null);
            setCollectionModal('import');
          }}
          onOpenAddModal={(collectionId: string) => {
            setActiveCollectionId(collectionId);
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
            <strong>Mailman v0.2.5</strong>
          </text>
          <text fg={isInstructionAnimating ? colors.accent.primary : colors.text.muted}>
            {liveInstruction}
          </text>
        </box>

        {activeRequestId ? (
          currentProtocol === 'websocket' ? (
            <box style={{ flexDirection: 'row', height: '100%' }} key={activeRequestId}>
              <box width="50%" style={{ flexDirection: 'column' }}>
                <WebSocketRequestPanel
                  focused={isFocused('request')}
                  onFocus={() => handleFocusArea('request')}
                  url={request.url}
                  onUrlChange={handleUrlChange}
                  message={request.body ?? ''}
                  onMessageChange={handleBodyChange}
                  headers={request.headers ?? {}}
                  onOpenHeaders={() => setActiveModal('headers')}
                  onConnect={handleWebSocketConnect}
                  onSendMessage={handleWebSocketSend}
                  onDisconnect={handleWebSocketDisconnect}
                  connected={Boolean(currentWebSocketResponse?.isStreaming)}
                  requestName={requestName}
                  saveStatus={saveStatus}
                />
              </box>
              <box width="50%" style={{ flexDirection: 'column' }}>
                <WebSocketResponsePanel
                  focused={isFocused('response')}
                  onFocus={() => handleFocusArea('response')}
                  response={currentWebSocketResponse}
                  onClearMessages={handleWebSocketClear}
                />
              </box>
            </box>
          ) : currentProtocol === 'graphql' ? (
            <box style={{ flexDirection: 'row', height: '100%' }} key={activeRequestId}>
              <box width="50%" style={{ flexDirection: 'column' }}>
                <GraphQLRequestPanel
                  focused={isFocused('request')}
                  onFocus={() => handleFocusArea('request')}
                  url={graphqlRequest.url}
                  onUrlChange={handleGraphqlUrlChange}
                  query={graphqlRequest.query}
                  onQueryChange={handleGraphqlQueryChange}
                  variables={graphqlRequest.variables}
                  onVariablesChange={handleGraphqlVariablesChange}
                  headers={graphqlRequest.headers}
                  onHeadersChange={handleGraphqlHeadersChange}
                  auth={graphqlRequest.auth}
                  scripts={graphqlRequest.scripts}
                  onAuthChange={handleGraphqlAuthChange}
                  onSend={handleGraphqlSend}
                  onOpenHeaders={() => setActiveModal('headers')}
                  onOpenAuth={() => setActiveModal('auth')}
                  onOpenScripts={() => setActiveModal('scripts')}
                  requestName={requestName}
                  saveStatus={saveStatus}
                />
              </box>
              <box width="50%" style={{ flexDirection: 'column' }}>
                <GraphQLResponsePanel
                  focused={isFocused('response')}
                  onFocus={() => handleFocusArea('response')}
                  response={currentGraphqlResponse}
                  isExpanded={showResponseModal}
                  onToggleExpand={setShowResponseModal}
                  onOpenStats={() => setShowRequestStatsModal(true)}
                  activeTab={graphqlActiveTab}
                  onActiveTabChange={setGraphqlActiveTab}
                  copyStatus={copyStatus}
                />
              </box>
            </box>
          ) : (
            <>
              <box height="35%" style={{ flexDirection: 'column' }}>
                <RequestPanel
                  focused={isFocused('request')}
                  onFocus={() => handleFocusArea('request')}
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
                  scripts={request.scripts}
                  onOpenHeaders={() => setActiveModal('headers')}
                  onOpenBody={() => setActiveModal('body')}
                  onOpenQuery={() => setActiveModal('query')}
                  onOpenAuth={() => setActiveModal('auth')}
                  onOpenScripts={() => setActiveModal('scripts')}
                  requestName={requestName}
                  saveStatus={saveStatus}
                />
              </box>

              <box height="65%" style={{ flexDirection: 'column', marginTop: 1 }}>
                <ResponsePanel
                  focused={isFocused('response')}
                  onFocus={() => handleFocusArea('response')}
                  response={currentResponse}
                  isExpanded={showResponseModal}
                  onToggleExpand={setShowResponseModal}
                  onOpenStats={() => setShowRequestStatsModal(true)}
                  onDisconnectStream={handleDisconnectStream}
                  onClearStream={handleClearStream}
                  activeTab={restActiveTab}
                  onActiveTabChange={setRestActiveTab}
                  activeSseTab={restActiveSseTab}
                  onActiveSseTabChange={setRestActiveSseTab}
                  copyStatus={copyStatus}
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

        {activeModal === 'scripts' && (
          <Modal isOpen={true} onClose={() => setActiveModal(null)} title="Scripts">
            <ScriptsEditor
              protocol={currentProtocol === 'graphql' ? 'graphql' : 'rest'}
              scripts={
                currentProtocol === 'graphql'
                  ? (graphqlRequest.scripts ?? {})
                  : (request.scripts ?? {})
              }
              onScriptsChange={
                currentProtocol === 'graphql' ? handleGraphqlScriptsChange : handleScriptsChange
              }
            />
          </Modal>
        )}

        {/* Collection Modals - rendered at App level for full screen sizing */}
        {collectionModal === 'import' && (
          <CollectionImportView
            isOpen={true}
            onClose={() => setCollectionModal(null)}
            onCollectionsChange={setCollections}
          />
        )}

        {collectionModal === 'add' && (
          <RequestAddingView
            isOpen={true}
            activeCollectionId={activeCollectionId}
            onClose={() => setCollectionModal(null)}
            onCollectionsChange={setCollections}
          />
        )}

        {collectionModal === 'export' && (
          <Modal isOpen={true} onClose={() => setCollectionModal(null)} title="Export Collection">
            <box style={{ flexDirection: 'column', gap: 1, padding: 1 }} />
          </Modal>
        )}
        {/* Response Expanded Modal - rendered at App level for full screen sizing */}
        {showResponseModal && currentResponse && (
          <ResponseModal
            response={currentResponse}
            onClose={() => setShowResponseModal(false)}
            activeTab={modalActiveTab}
            onActiveTabChange={setModalActiveTab}
          />
        )}
        {showRequestStatsModal &&
          (currentProtocol === 'graphql' ? currentGraphqlResponse : currentResponse) && (
            <Modal
              isOpen={true}
              onClose={() => setShowRequestStatsModal(false)}
              title="Request Stats"
            >
              <RequestStatsModal
                response={
                  (currentProtocol === 'graphql' ? currentGraphqlResponse : currentResponse)!
                }
              />
            </Modal>
          )}
        {/* Catalog Help Modal */}
        {showHelp && (
          <Modal isOpen={true} onClose={() => setShowHelp(false)} title="Help">
            <CatalogPanel onClose={() => setShowHelp(false)} />
          </Modal>
        )}
        {showHistoryModal && (
          <Modal
            isOpen={true}
            onClose={() => {
              setShowHistoryModal(false);
              setHistoryError(null);
            }}
            title="Request History"
            subtitle={`${historyEntries.length} entries`}
          >
            <HistoryModal
              entries={historyEntries}
              onOpenEntry={openFromHistory}
              errorMessage={historyError}
            />
          </Modal>
        )}
        {notification && (
          <Notification
            isOpen={true}
            title={notification.title}
            message={notification.message}
            variant={notification.variant}
            actions={notification.actions}
            onClose={() => setNotification(null)}
          />
        )}

        {/* Theme Selector Modal */}
        <ThemeSelector isOpen={showThemeSelector} onClose={() => setShowThemeSelector(false)} />
      </box>
    </box>
  );
}
