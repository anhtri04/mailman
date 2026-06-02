import { useMemo, useCallback, useEffect, useState } from 'react';
import { useKeyboard } from '@opentui/react';
import { useTheme } from '../../../shared/theme/ThemeProvider';
import type { ResponseState } from '../../../types';
import type {
  GraphqlResponseTab,
  RestResponseTab,
} from '../../../shared/utils/responseCopyUtility';
import { Modal } from './Modal';
import { SyntaxHighlighter } from './SyntaxHighlighter';
import { HeadersDisplay } from './HeadersDisplay';
import { detectContentType, formatResponseBody } from '../../../shared/utils/response-formatter';
import { ScriptResultsPanel } from './ScriptResultsPanel';
import { JsonTreeViewer, canRenderJsonTree } from './JsonTreeViewer';

type ResponseModalTab = GraphqlResponseTab | RestResponseTab;

const REST_TABS: RestResponseTab[] = ['body', 'headers', 'raw'];
const GRAPHQL_TABS: GraphqlResponseTab[] = ['body', 'headers', 'raw', 'errors'];

type ResponseModalProps = {
  response: ResponseState;
  onClose: () => void;
} & (
  | {
      variant?: 'rest';
      activeTab: RestResponseTab;
      onActiveTabChange: (tab: RestResponseTab) => void;
    }
  | {
      variant: 'graphql';
      activeTab: GraphqlResponseTab;
      onActiveTabChange: (tab: GraphqlResponseTab) => void;
    }
);

export function ResponseModal(props: ResponseModalProps) {
  const { response, onClose } = props;
  const { colors } = useTheme();
  const [collapsedJsonPaths, setCollapsedJsonPaths] = useState<Set<string>>(new Set());

  const contentType = useMemo(() => {
    return detectContentType(response.headers, response.body);
  }, [response]);

  const formattedBody = useMemo(() => {
    if (props.variant === 'graphql') {
      try {
        return JSON.stringify(JSON.parse(response.body), null, 2);
      } catch {
        return response.body;
      }
    }

    return formatResponseBody(response.body, contentType);
  }, [response, contentType, props.variant]);

  const hasScriptResults = !!(
    response.scriptResults?.beforeRequest || response.scriptResults?.afterResponse
  );

  const shouldRenderJsonTree = useMemo(() => {
    if (props.variant === 'graphql') {
      return canRenderJsonTree(response.body);
    }

    return contentType === 'json' && canRenderJsonTree(response.body);
  }, [response.body, contentType, props.variant]);

  useEffect(() => {
    setCollapsedJsonPaths(new Set());
  }, [response.body]);

  const handleToggleJsonPath = useCallback((path: string) => {
    setCollapsedJsonPaths((current) => {
      const next = new Set(current);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const contentSize = useMemo(() => {
    const bytes = new TextEncoder().encode(response.body).length;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }, [response]);

  const graphqlErrors = useMemo(() => {
    if (props.variant !== 'graphql') return [];

    try {
      const parsed = JSON.parse(response.body) as {
        errors?: Array<{
          message?: string;
          path?: (string | number)[];
          locations?: Array<{ line: number; column: number }>;
        }>;
      };

      return Array.isArray(parsed.errors) ? parsed.errors : [];
    } catch {
      return [];
    }
  }, [response.body, props.variant]);

  const restAvailableTabs = useMemo<RestResponseTab[]>(() => {
    return hasScriptResults ? [...REST_TABS, 'test'] : REST_TABS;
  }, [hasScriptResults]);

  const graphqlAvailableTabs = useMemo<GraphqlResponseTab[]>(() => {
    return hasScriptResults ? [...GRAPHQL_TABS, 'test'] : GRAPHQL_TABS;
  }, [hasScriptResults]);

  useKeyboard((key) => {
    if (key.name !== 'tab') return;

    if (props.variant === 'graphql') {
      const currentIndex = graphqlAvailableTabs.indexOf(props.activeTab);
      const nextIndex = (currentIndex + 1) % graphqlAvailableTabs.length;
      const nextTab = graphqlAvailableTabs[nextIndex];
      if (nextTab) {
        props.onActiveTabChange(nextTab);
      }
      return;
    }

    const currentIndex = restAvailableTabs.indexOf(props.activeTab);
    const nextIndex = (currentIndex + 1) % restAvailableTabs.length;
    const nextTab = restAvailableTabs[nextIndex];
    if (nextTab) {
      props.onActiveTabChange(nextTab);
    }
  });

  const isGraphqlJson = useMemo(() => {
    if (props.variant !== 'graphql') return true;

    try {
      JSON.parse(response.body);
      return true;
    } catch {
      return false;
    }
  }, [response.body, props.variant]);

  const renderTabButton = useCallback(
    (tab: ResponseModalTab, label: string, onSelect: () => void) => {
      const isActive = props.activeTab === tab;
      return (
        <box
          style={{
            paddingLeft: 2,
            paddingRight: 2,
            paddingTop: 0,
            paddingBottom: 0,
            border: true,
            borderColor: isActive ? colors.accent.primary : colors.border.default,
          }}
          onMouseDown={(e: { stopPropagation: () => void }) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          <text fg={isActive ? colors.accent.primary : colors.text.muted}>
            {isActive ? <strong>{label}</strong> : label}
          </text>
        </box>
      );
    },
    [colors, props.activeTab],
  );

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Response - ${response.status} ${response.statusText}`}
    >
      <box style={{ flexDirection: 'column', flexGrow: 1, flexShrink: 1, minHeight: 0 }}>
        <box style={{ flexDirection: 'row', gap: 2, marginBottom: 1, flexShrink: 0 }}>
          <text fg={colors.text.muted}>{contentSize}</text>
          <text fg={colors.text.muted}>{response.time}ms</text>
        </box>

        {props.variant === 'graphql' ? (
          <box style={{ flexDirection: 'row', gap: 1, marginBottom: 1, flexShrink: 0 }}>
            {renderTabButton('body', 'Body', () => props.onActiveTabChange('body'))}
            {renderTabButton('headers', 'Headers', () => props.onActiveTabChange('headers'))}
            {renderTabButton('raw', 'Raw', () => props.onActiveTabChange('raw'))}
            {renderTabButton(
              'errors',
              graphqlErrors.length > 0 ? `Errors (${graphqlErrors.length})` : 'Errors',
              () => props.onActiveTabChange('errors'),
            )}
            {hasScriptResults &&
              renderTabButton('test', 'Test', () => props.onActiveTabChange('test'))}
          </box>
        ) : (
          <box style={{ flexDirection: 'row', gap: 1, marginBottom: 1, flexShrink: 0 }}>
            {renderTabButton('body', 'Body', () => props.onActiveTabChange('body'))}
            {renderTabButton('headers', 'Headers', () => props.onActiveTabChange('headers'))}
            {renderTabButton('raw', 'Raw', () => props.onActiveTabChange('raw'))}
            {hasScriptResults &&
              renderTabButton('test', 'Test', () => props.onActiveTabChange('test'))}
          </box>
        )}

        <scrollbox style={{ flexGrow: 1, flexShrink: 1, minHeight: 0 }}>
          {props.activeTab === 'body' &&
            (shouldRenderJsonTree ? (
              <JsonTreeViewer
                body={response.body}
                collapsedPaths={collapsedJsonPaths}
                onTogglePath={handleToggleJsonPath}
              />
            ) : (
              <SyntaxHighlighter
                code={formattedBody}
                language={
                  props.variant === 'graphql'
                    ? 'json'
                    : contentType === 'json' || contentType === 'xml' || contentType === 'html'
                      ? contentType
                      : 'text'
                }
              />
            ))}

          {props.activeTab === 'headers' && response.headers && (
            <HeadersDisplay headers={response.headers} />
          )}

          {props.activeTab === 'raw' && <text fg={colors.text.primary}>{response.body}</text>}

          {props.activeTab === 'test' && <ScriptResultsPanel results={response.scriptResults} />}

          {props.variant === 'graphql' &&
            props.activeTab === 'errors' &&
            (graphqlErrors.length > 0 ? (
              <box style={{ flexDirection: 'column', gap: 1 }}>
                {graphqlErrors.map((error, index) => (
                  <box
                    key={index}
                    style={{
                      flexDirection: 'column',
                      border: true,
                      borderColor: colors.syntax.error,
                      padding: 1,
                      marginBottom: 1,
                    }}
                  >
                    <text fg={colors.syntax.error}>
                      <strong>{error.message ?? 'Unknown GraphQL error'}</strong>
                    </text>
                    {error.path && error.path.length > 0 && (
                      <text fg={colors.text.muted} style={{ marginTop: 0.5 }}>
                        Path: {error.path.join('.')}
                      </text>
                    )}
                    {error.locations && error.locations.length > 0 && (
                      <text fg={colors.text.muted} style={{ marginTop: 0.5 }}>
                        Location: line {error.locations[0]!.line}, column{' '}
                        {error.locations[0]!.column}
                      </text>
                    )}
                  </box>
                ))}
              </box>
            ) : isGraphqlJson ? (
              <text fg={colors.syntax.success}>No GraphQL errors found.</text>
            ) : (
              <text fg={colors.text.muted}>Unable to parse response as JSON.</text>
            ))}
        </scrollbox>
      </box>
    </Modal>
  );
}
