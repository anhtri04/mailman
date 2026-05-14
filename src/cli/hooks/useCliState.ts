import { useCallback, useState } from 'react';
import type { CliOutputEntry, CliSessionState } from '../types';

const initialState: CliSessionState = {
  input: '',
  outputs: [],
  history: [],
  historyIndex: null,
  activeCollectionId: null,
  activeRequest: {
    method: 'GET',
    url: '',
    headers: {},
    body: '',
  },
  collections: [],
  lastResponse: null,
  toggles: {
    showBody: true,
    showHeaders: true,
    showMeta: true,
  },
  isLoading: false,
};

export function useCliState() {
  const [state, setState] = useState<CliSessionState>(initialState);

  const pushOutput = useCallback((kind: CliOutputEntry['kind'], content: string) => {
    setState((prev) => ({
      ...prev,
      outputs: [
        ...prev.outputs,
        {
          id: Date.now().toString(),
          kind,
          content,
          timestamp: Date.now(),
        },
      ],
    }));
  }, []);

  return {
    state,
    setState,
    pushOutput,
  };
}
