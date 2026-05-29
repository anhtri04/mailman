import { describe, expect, test } from 'bun:test';
import type { Collection } from '../../../../core/types';
import type { CliEditorPanel, CliSessionState } from '../../types';
import { buildEditorCommands } from './editors';
import type { CommandContext, CommandResult } from '../registry';

const collections: Collection[] = [
  {
    id: 'col-1',
    name: 'Users',
    requests: [
      {
        id: 'req-rest',
        name: 'List Users',
        protocol: 'rest',
        method: 'GET',
        url: 'https://example.com/users?page=1',
        headers: { Accept: 'application/json' },
        body: { mode: 'none' },
        scripts: {},
      },
      {
        id: 'req-graphql',
        name: 'Viewer',
        protocol: 'graphql',
        url: 'https://example.com/graphql',
        headers: {},
        query: '{ viewer { id } }',
        variables: '{}',
        scripts: {},
      },
    ],
  },
];

function command(name: string) {
  const match = buildEditorCommands().find((item) => item.name === name);
  if (!match) throw new Error(`Missing command: ${name}`);
  return match;
}

function createState(overrides: Partial<CliSessionState> = {}): CliSessionState {
  return {
    input: '',
    outputs: [],
    history: [],
    historyIndex: null,
    activeCollectionId: null,
    activeRequest: {
      method: 'GET',
      url: '',
      headers: {},
      body: { mode: 'none' },
    },
    activeRequestItem: null,
    collections,
    virtualPath: { kind: 'root' },
    lastResponse: null,
    toggles: {
      showBody: true,
      showHeaders: true,
      showMeta: true,
    },
    isLoading: false,
    ...overrides,
  };
}

function createContext(initialState: CliSessionState) {
  let state = initialState;
  let openedPanel: CliEditorPanel | null = null;
  let saveCalled = false;

  const ctx: CommandContext = {
    get state() {
      return state;
    },
    setState: (updater) => {
      state = updater(state);
    },
    cleanExit: () => {},
    openThemeSelector: () => {},
    openHistory: () => {},
    openSettings: () => {},
    openEditor: (panel) => {
      openedPanel = panel;
    },
    saveActiveRequest: async (): Promise<CommandResult> => {
      saveCalled = true;
      return { message: 'Saved request.' };
    },
  };

  return {
    ctx,
    get state() {
      return state;
    },
    get openedPanel() {
      return openedPanel;
    },
    get saveCalled() {
      return saveCalled;
    },
  };
}

describe('editor commands', () => {
  test('reject editor commands outside request paths', async () => {
    const harness = createContext(createState());

    const result = await command('header').handler([], harness.ctx);

    expect(result.error).toContain('inside a request path');
    expect(harness.openedPanel).toBeNull();
  });

  test('opens editor and hydrates draft from current request path', async () => {
    const harness = createContext(
      createState({
        virtualPath: { kind: 'request', collectionId: 'col-1', requestId: 'req-rest' },
      }),
    );

    const result = await command('header').handler([], harness.ctx);

    expect(result.message).toBe('Open headers editor.');
    expect(harness.openedPanel).toBe('headers');
    expect(harness.state.activeCollectionId).toBe('col-1');
    expect(harness.state.activeRequestItem?.id).toBe('req-rest');
    expect(harness.state.activeRequest.url).toBe('https://example.com/users?page=1');
  });

  test('does not clobber unsaved draft when reopening an editor for the same request', async () => {
    const restRequest = collections[0]!.requests[0]!;
    const harness = createContext(
      createState({
        activeCollectionId: 'col-1',
        activeRequestItem: {
          ...restRequest,
          protocol: 'rest',
          method: 'GET',
          body: { mode: 'none' },
          headers: { Accept: 'application/json', 'X-Draft': 'yes' },
        },
        virtualPath: { kind: 'request', collectionId: 'col-1', requestId: 'req-rest' },
      }),
    );

    await command('header').handler([], harness.ctx);

    expect(harness.state.activeRequestItem?.headers['X-Draft']).toBe('yes');
    expect(harness.state.activeRequest.headers?.['X-Draft']).toBe('yes');
  });

  test('enforces protocol-specific editor commands', async () => {
    const graphqlHarness = createContext(
      createState({
        virtualPath: { kind: 'request', collectionId: 'col-1', requestId: 'req-graphql' },
      }),
    );
    const restHarness = createContext(
      createState({
        virtualPath: { kind: 'request', collectionId: 'col-1', requestId: 'req-rest' },
      }),
    );

    const bodyResult = await command('body').handler([], graphqlHarness.ctx);
    const queryResult = await command('query').handler([], restHarness.ctx);

    expect(bodyResult.error).toBe('/body is only available for rest requests.');
    expect(queryResult.error).toBe('/query is only available for graphql requests.');
    expect(graphqlHarness.openedPanel).toBeNull();
    expect(restHarness.openedPanel).toBeNull();
  });

  test('save command delegates to CLI save handler', async () => {
    const harness = createContext(createState());

    const result = await command('save').handler([], harness.ctx);

    expect(harness.saveCalled).toBe(true);
    expect(result.message).toBe('Saved request.');
  });
});
