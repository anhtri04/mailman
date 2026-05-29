import { useCallback, useState } from 'react';
import { emptyRequestBody } from '../../../core/services';
import type { ResponseState } from '../../../core/types';
import type { CliOutputEntry, CliResponseProtocol, CliSessionState } from '../types';

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
    body: emptyRequestBody(),
  },
  activeRequestItem: null,
  collections: [],
  virtualPath: { kind: 'root' },
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

  const pushOutput = useCallback(
    (kind: Exclude<CliOutputEntry['kind'], 'response'>, content: string) => {
      setState((prev) => {
        const timestamp = Date.now();
        return {
          ...prev,
          outputs: [
            ...prev.outputs,
            {
              id: `${timestamp}-${prev.outputs.length}`,
              kind,
              content,
              timestamp,
            },
          ],
        };
      });
    },
    [],
  );

  const pushResponseOutput = useCallback(
    (
      response: ResponseState,
      request: { protocol: CliResponseProtocol; method: string; url: string },
    ) => {
      const timestamp = Date.now();
      const id = `${timestamp}-${Math.random().toString(36).slice(2)}`;

      setState((prev) => ({
        ...prev,
        outputs: [
          ...prev.outputs,
          {
            id,
            kind: 'response',
            response,
            request,
            timestamp,
          },
        ],
      }));

      return id;
    },
    [],
  );

  const updateResponseOutput = useCallback(
    (id: string, updater: (response: ResponseState) => ResponseState) => {
      setState((prev) => ({
        ...prev,
        outputs: prev.outputs.map((entry) =>
          entry.kind === 'response' && entry.id === id
            ? { ...entry, response: updater(entry.response) }
            : entry,
        ),
      }));
    },
    [],
  );

  return {
    state,
    setState,
    pushOutput,
    pushResponseOutput,
    updateResponseOutput,
  };
}
