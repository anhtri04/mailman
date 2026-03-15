import { useState } from 'react';
import { useKeyboard } from '@opentui/react';
import type { ResponseState } from '../types';
import { Modal } from './Modal';

interface ResponsePanelProps {
  focused: boolean;
  onFocus: () => void;
  response: ResponseState | null;
}

export function ResponsePanel({ focused, onFocus, response }: ResponsePanelProps) {
  const borderColor = focused ? '#CC8844' : '#555555';
  const [isExpanded, setIsExpanded] = useState(false);

  useKeyboard((key) => {
    if (key.name === 'space' && response && !isExpanded) {
      setIsExpanded(true);
    } else if (key.name === 'escape' && isExpanded) {
      setIsExpanded(false);
    }
  });

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
      <box style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <text fg="#CC8844">
          <strong>Response</strong>
        </text>
        {response && <text fg="#999999">{response.time}ms</text>}
      </box>

      <box style={{ flexGrow: 1, marginTop: 1 }}>
        {response ? (
          <box style={{ flexDirection: 'column' }}>
            <text
              fg={
                response.status === 0
                  ? '#CC8844'
                  : response.status >= 200 && response.status < 300
                    ? '#99AA77'
                    : response.status >= 400 && response.status < 500
                      ? '#AA7733'
                      : '#AA5555'
              }
            >
              {response.status > 0
                ? `${response.status} ${response.statusText}`
                : response.statusText}
            </text>

            <scrollbox style={{ flexGrow: 1, marginTop: 1 }}>
              <text fg="#FFFFFF">{response.body}</text>
            </scrollbox>

            <text fg="#666666" style={{ marginTop: 1 }}>
              Press SPACE to expand
            </text>
          </box>
        ) : (
          <text fg="#666666">No response yet. Send a request to see results.</text>
        )}
      </box>

      {isExpanded && response && (
        <Modal
          isOpen={true}
          onClose={() => setIsExpanded(false)}
          title={`Response - ${response.status} ${response.statusText}`}
        >
          <box style={{ flexDirection: 'column', flexGrow: 1 }}>
            <text fg="#999999">{response.time}ms • Press ESC to close</text>
            <scrollbox style={{ flexGrow: 1, marginTop: 1 }}>
              <text fg="#FFFFFF">{response.body}</text>
            </scrollbox>
          </box>
        </Modal>
      )}
    </box>
  );
}
