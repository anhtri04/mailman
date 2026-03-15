import { useState } from 'react';
import { useKeyboard } from '@opentui/react';

export function App() {
  const [count, setCount] = useState(0);

  useKeyboard((key) => {
    if (key.name === 'q') {
      const cleanExit = (globalThis as any).__mailmanCleanExit;
      if (cleanExit) cleanExit();
    }
    if (key.name === 'space') {
      setCount((c) => c + 1);
    }
  });

  return (
    <box
      style={{
        flexDirection: 'column',
        padding: 2,
        backgroundColor: 'black',
      }}
    >
      <text fg="#CC8844" bold>
        Mailman v0.0.1
      </text>
      <text fg="#999999">
        Press SPACE to increment, Q to quit
      </text>
      <text fg="#FFFFFF">
        Count: {count}
      </text>
    </box>
  );
}
