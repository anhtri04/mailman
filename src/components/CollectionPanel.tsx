import { useState, useCallback, useMemo, useEffect } from 'react';
import { useKeyboard } from '@opentui/react';
import { useTheme } from '../theme/ThemeProvider';
import type { Collection, RequestItem } from '../types';

interface CollectionPanelProps {
  focused: boolean;
  onFocus: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  collections: Collection[];
  onLoadRequest: (request: RequestItem, collectionId: string) => void;
  onSelectCollection?: (collectionId: string | null) => void;
  onOpenImportModal: () => void;
  onOpenAddModal: (collectionId: string) => void;
  onDeleteItem: (collectionId: string, requestId?: string) => void;
}

type TreeNode =
  | { type: 'collection'; collection: Collection; index: number }
  | { type: 'request'; request: RequestItem; collectionId: string; index: number };

function abbreviateMethod(method: string): string {
  switch (method) {
    case 'DELETE':
      return 'DEL';
    case 'PATCH':
      return 'PTCH';
    default:
      return method;
  }
}

export function CollectionPanel({
  focused,
  onFocus,
  isCollapsed,
  onToggleCollapse,
  collections,
  onLoadRequest,
  onSelectCollection,
  onOpenImportModal,
  onOpenAddModal,
  onDeleteItem,
}: CollectionPanelProps) {
  const { colors } = useTheme();
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set());
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const toggleCollection = useCallback((id: string) => {
    setExpandedCollections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const treeNodes = useMemo<TreeNode[]>(() => {
    const nodes: TreeNode[] = [];
    let index = 0;
    for (const collection of collections) {
      nodes.push({ type: 'collection', collection, index: index++ });
      if (expandedCollections.has(collection.id)) {
        for (const request of collection.requests) {
          nodes.push({ type: 'request', request, collectionId: collection.id, index: index++ });
        }
      }
    }
    return nodes;
  }, [collections, expandedCollections]);

  const selectedNode = treeNodes[selectedIndex];

  const selectedCollectionId =
    selectedNode?.type === 'collection'
      ? selectedNode.collection.id
      : selectedNode?.type === 'request'
        ? selectedNode.collectionId
        : null;

  const handleSelect = useCallback(() => {
    if (!selectedNode) return;
    if (selectedNode.type === 'collection') {
      toggleCollection(selectedNode.collection.id);
    } else {
      onLoadRequest(selectedNode.request, selectedNode.collectionId);
    }
  }, [selectedNode, toggleCollection, onLoadRequest, onSelectCollection]);

  useEffect(() => {
    if (!selectedNode) {
      onSelectCollection?.(null);
    } else if (selectedNode.type === 'collection') {
      onSelectCollection?.(selectedNode.collection.id);
    }
  }, [selectedNode, onSelectCollection]);

  useKeyboard((key) => {
    if (!focused) return;
    if (isCollapsed) return;

    if (key.name === 'up') {
      setSelectedIndex((prev) => Math.max(-1, prev - 1));
    } else if (key.name === 'down') {
      setSelectedIndex((prev) => Math.min(treeNodes.length - 1, prev + 1));
    } else if (key.name === 'right' || key.name === 'return' || key.name === 'enter') {
      handleSelect();
    } else if (key.name === 'left') {
      if (selectedNode?.type === 'request') {
        setExpandedCollections((prev) => {
          const next = new Set(prev);
          next.delete(selectedNode.collectionId);
          return next;
        });
      } else if (selectedNode?.type === 'collection') {
        toggleCollection(selectedNode.collection.id);
      }
    }
  });

  const borderColor = focused ? colors.accent.primary : colors.border.default;

  return (
    <box
      style={{
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        backgroundColor: colors.bg.app,
        borderColor,
        border: true,
        padding: isCollapsed ? 0 : 1,
        gap: 1,
        borderStyle: 'rounded',
      }}
      onMouseDown={onFocus}
    >
      {!isCollapsed && (
        <box style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: -2 }}>
          <text
            fg={colors.accent.primary}
            bg={colors.bg.app}
            style={{ paddingLeft: 1, paddingRight: 1 }}
          >
            <strong> Collections </strong>
          </text>
        </box>
      )}
      <box style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: -2 }}>
        {!isCollapsed && (
          <box style={{ flexDirection: 'row', gap: 1, marginTop: 1 }}>
            <box
              style={{
                border: true,
                borderColor: colors.border.default,
                borderStyle: 'rounded',
                paddingLeft: 1,
                paddingRight: 1,
                paddingTop: 0.5,
                paddingBottom: 0.5,
              }}
              onMouseDown={(e: { stopPropagation: () => void }) => {
                e.stopPropagation();
                onFocus();
                onOpenImportModal();
              }}
            >
              <text fg={colors.accent.primary}>⬆</text>
            </box>

            <box
              style={{
                border: true,
                borderColor: colors.border.default,
                borderStyle: 'rounded',
                paddingLeft: 1,
                paddingRight: 1,
                paddingTop: 0.5,
                paddingBottom: 0.5,
              }}
              onMouseDown={(e: { stopPropagation: () => void }) => {
                e.stopPropagation();
                onFocus();
                if (selectedCollectionId) {
                  onOpenAddModal(selectedCollectionId);
                }
              }}
            >
              <text fg={colors.accent.primary}>+</text>
            </box>

            <box
              style={{
                border: true,
                borderColor: colors.border.default,
                borderStyle: 'rounded',
                paddingLeft: 1,
                paddingRight: 1,
                paddingTop: 0.5,
                paddingBottom: 0.5,
              }}
              onMouseDown={(e: { stopPropagation: () => void }) => {
                e.stopPropagation();
                onFocus();
                if (selectedNode?.type === 'collection') {
                  onDeleteItem(selectedNode.collection.id);
                } else if (selectedNode?.type === 'request') {
                  onDeleteItem(selectedNode.collectionId, selectedNode.request.id);
                }
              }}
            >
              <text fg={colors.syntax.error}>−</text>
            </box>
          </box>
        )}

        <box
          style={{
            border: true,
            borderColor: colors.border.default,
            borderStyle: 'rounded',
            marginTop: 1,
            paddingLeft: 1,
            paddingRight: 1,
            paddingTop: 0.5,
            paddingBottom: 0.5,
          }}
          onMouseDown={(e: { stopPropagation: () => void }) => {
            e.stopPropagation();
            onToggleCollapse();
          }}
        >
          <text fg={colors.accent.primary}>{isCollapsed ? '→' : '←'}</text>
        </box>
      </box>

      {!isCollapsed && (
        <box style={{ flexDirection: 'column', flexGrow: 1, gap: 0, overflow: 'hidden' }}>
          <scrollbox style={{ flexGrow: 1 }}>
            {treeNodes.map((node) => {
              const isSelected = node.index === selectedIndex;
              const isCollection = node.type === 'collection';
              const methodColors = !isCollection
                ? colors.methods[node.request.method.toUpperCase() as keyof typeof colors.methods]
                : null;

              return (
                <box
                  key={
                    isCollection ? node.collection.id : `${node.collectionId}-${node.request.id}`
                  }
                  style={{
                    flexDirection: 'row',
                    paddingLeft: isCollection ? 0 : 2,
                    backgroundColor:
                      isSelected && focused ? colors.bg.focusHighlight : 'transparent',
                  }}
                  onMouseDown={() => {
                    setSelectedIndex(node.index);
                    onFocus();
                    if (isCollection) {
                      toggleCollection(node.collection.id);
                    } else {
                      onLoadRequest(node.request, node.collectionId);
                    }
                  }}
                >
                  <text fg={isSelected ? colors.accent.primary : colors.text.muted}>
                    {isCollection
                      ? expandedCollections.has(node.collection.id)
                        ? '▼ '
                        : '▶ '
                      : '  '}
                  </text>
                  {isCollection ? (
                    <text
                      fg={isSelected ? colors.accent.text : colors.text.primary}
                      bg={isSelected && focused ? colors.bg.focusHighlight : 'transparent'}
                    >
                      <strong>{node.collection.name}</strong>
                    </text>
                  ) : (
                    <>
                      <box
                        style={{
                          width: 4,
                          border: false,
                          paddingLeft: 0,
                          paddingRight: 0,
                          marginRight: 0.5,
                        }}
                      >
                        <text fg={methodColors?.text ?? '#ffffff'}>{abbreviateMethod(node.request.method)}</text>
                      </box>
                      <text
                        fg={colors.text.primary}
                        bg={isSelected && focused ? colors.bg.focusHighlight : 'transparent'}
                      >
                        {' '}
                        {(node.request.name || node.request.url).length > 10
                          ? (node.request.name || node.request.url).slice(0, 10) + '...'
                          : node.request.name || node.request.url}
                      </text>
                    </>
                  )}
                </box>
              );
            })}
            {treeNodes.length === 0 && (
              <text fg={colors.text.dim} style={{ paddingLeft: 1 }}>
                No collections yet
              </text>
            )}
          </scrollbox>
        </box>
      )}
    </box>
  );
}
