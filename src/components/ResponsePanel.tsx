import type { ResponseState } from '../types';

interface ResponsePanelProps {
  focused: boolean;
  onFocus: () => void;
  response: ResponseState | null;
}

export function ResponsePanel({ focused, onFocus, response }: ResponsePanelProps) {
  const borderColor = focused ? '#CC8844' : '#555555';

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
        <text fg="#CC8844" bold>
          Response
        </text>
        {response && (
          <text fg="#999999">
            {response.time}ms
          </text>
        )}
      </box>

      <box style={{ flexGrow: 1, marginTop: 1 }}>
        {response ? (
          <box style={{ flexDirection: 'column' }}>
            <text fg={response.status < 400 ? '#99AA77' : '#AA5555'}>
              {response.status} {response.statusText}
            </text>
            
            <box style={{ marginTop: 1, flexGrow: 1 }}>
              <text fg="#FFFFFF">
                {response.body}
              </text>
            </box>
          </box>
        ) : (
          <text fg="#666666">
            No response yet. Send a request to see results.
          </text>
        )}
      </box>
    </box>
  );
}
