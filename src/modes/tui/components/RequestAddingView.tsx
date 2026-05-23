import { useState } from 'react';
import type { KeyBinding } from '@opentui/core';
import { useTheme } from '../../../shared/theme/ThemeProvider';
import { addRequestToCollection, loadCollections } from '../../../core/services';
import type { Collection, Protocol, RequestItemInput } from '../../../core/types';
import { parseCurl } from '../../../shared/utils/curlUtility';
import { Modal } from './Modal';

interface RequestAddingViewProps {
  isOpen: boolean;
  activeCollectionId: string | null;
  onClose: () => void;
  onCollectionsChange: (collections: Collection[]) => void;
}

const requestProtocolOptions: Protocol[] = ['rest', 'graphql', 'websocket'];
const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

export function RequestAddingView({
  isOpen,
  activeCollectionId,
  onClose,
  onCollectionsChange,
}: RequestAddingViewProps) {
  const { colors } = useTheme();
  const selectAllBindings: KeyBinding[] = [{ name: 'a', ctrl: true, action: 'select-all' }];
  const [newRequestProtocol, setNewRequestProtocol] = useState<Protocol>('rest');
  const [newRequestMethod, setNewRequestMethod] = useState('GET');
  const [newRequestName, setNewRequestName] = useState('');
  const [curlText, setCurlText] = useState('');

  const resetAndClose = () => {
    setNewRequestName('');
    setNewRequestProtocol('rest');
    setNewRequestMethod('GET');
    setCurlText('');
    onClose();
  };

  const handleAddRequest = () => {
    if (!newRequestName.trim() || !activeCollectionId) return;

    let selectedProtocol = newRequestProtocol;
    let method = newRequestMethod;
    let url = '';
    let headers: Record<string, string> = {};
    let body = '';
    let variables = '';

    if (curlText.trim()) {
      try {
        const parsed = parseCurl(curlText.trim());
        method = parsed.method;
        url = parsed.url;
        headers = parsed.headers;
        if (parsed.protocol === 'graphql') {
          selectedProtocol = 'graphql';
          body = parsed.query;
          variables = parsed.variables || '';
        } else if (parsed.body) {
          body = parsed.body;
        }
      } catch {
        // parsing failed, falls through to use manual method
      }
    }

    const requestInput: RequestItemInput =
      selectedProtocol === 'graphql'
        ? {
            protocol: 'graphql',
            name: newRequestName.trim(),
            url,
            query: body,
            variables,
            headers,
          }
        : selectedProtocol === 'websocket'
          ? {
              protocol: 'websocket',
              name: newRequestName.trim(),
              url,
              headers,
              initialMessage: body,
            }
          : {
              protocol: 'rest',
              method,
              name: newRequestName.trim(),
              url,
              headers,
              body,
            };

    void (async () => {
      await addRequestToCollection(activeCollectionId, requestInput);
      const updated = await loadCollections();
      onCollectionsChange(updated);
    })();

    resetAndClose();
  };

  if (!activeCollectionId) return null;

  return (
    <Modal isOpen={isOpen} onClose={resetAndClose} title="Add Request">
      <box style={{ flexDirection: 'column', gap: 1, padding: 1 }}>
        <box style={{ flexDirection: 'row', gap: 1, alignItems: 'center' }}>
          <text fg={colors.text.muted}>Protocol:</text>
          {requestProtocolOptions.map((protocol) => (
            <box
              key={protocol}
              style={{
                border: true,
                borderColor:
                  newRequestProtocol === protocol ? colors.accent.primary : colors.border.default,
                borderStyle: 'rounded',
                paddingLeft: 1,
                paddingRight: 1,
                paddingBottom: 0.5,
              }}
              onMouseDown={() => setNewRequestProtocol(protocol)}
            >
              <text
                fg={newRequestProtocol === protocol ? colors.accent.primary : colors.text.muted}
              >
                {protocol.toUpperCase()}
              </text>
            </box>
          ))}
        </box>

        {newRequestProtocol === 'rest' && (
          <box style={{ flexDirection: 'row', gap: 1, alignItems: 'center' }}>
            <text fg={colors.text.muted}>Method:</text>
            <box
              style={{
                border: true,
                borderColor: colors.border.default,
                borderStyle: 'rounded',
                paddingLeft: 1,
                paddingRight: 1,
                paddingBottom: 0.5,
              }}
              onMouseDown={() => {
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
          </box>
        )}

        <box
          style={{
            border: true,
            borderColor: colors.border.default,
            borderStyle: 'rounded',
            paddingLeft: 1,
            paddingBottom: 0.5,
          }}
        >
          <input
            placeholder="Request name..."
            value={newRequestName}
            onInput={(val: string) => setNewRequestName(val)}
            focused={true}
            keyBindings={selectAllBindings}
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
            keyBindings={selectAllBindings}
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
              paddingBottom: 0.5,
            }}
            onMouseDown={handleAddRequest}
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
              paddingBottom: 0.5,
            }}
            onMouseDown={resetAndClose}
          >
            <text fg={colors.text.muted}>Cancel</text>
          </box>
        </box>
      </box>
    </Modal>
  );
}
