interface RequestPanelProps {
  focused: boolean;
  onFocus: () => void;
  url: string;
  onUrlChange: (url: string) => void;
  method: string;
  onMethodChange: (method: string) => void;
  onSend: () => void;
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
}: RequestPanelProps) {
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
            borderColor: '#555555',
            paddingLeft: 1,
            paddingRight: 1,
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
        >
          <text fg={url ? '#FFFFFF' : '#666666'}>{url || 'Enter URL...'}</text>
        </box>
      </box>

      <box
        style={{
          marginTop: 1,
          border: true,
          borderColor: '#CC8844',
          backgroundColor: '#CC8844',
          paddingLeft: 2,
          paddingRight: 2,
          alignSelf: 'flex-start',
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
  );
}
