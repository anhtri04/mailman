import type { FocusArea, Protocol } from '../../../core/types';

type EditorModal = 'headers' | 'body' | 'query' | 'auth' | 'scripts' | null;
type CollectionModal = 'import' | 'add' | 'export' | null;

export type InstructionContextKey =
  | 'app.blocked.help'
  | 'app.blocked.theme'
  | 'app.blocked.responseModal'
  | 'app.blocked.requestStats'
  | 'app.blocked.document'
  | 'app.blocked.history'
  | 'app.blocked.editorModal.headers'
  | 'app.blocked.editorModal.body'
  | 'app.blocked.editorModal.query'
  | 'app.blocked.editorModal.auth'
  | 'app.blocked.editorModal.scripts'
  | 'app.blocked.collectionModal.import'
  | 'app.blocked.collectionModal.add'
  | 'app.blocked.collectionModal.export'
  | 'request.loading.rest'
  | 'request.loading.graphql'
  | 'request.streaming.rest'
  | 'request.active.rest.request'
  | 'request.active.rest.response'
  | 'request.active.graphql.request'
  | 'request.active.graphql.response'
  | 'collection.selected.noRequest.rest'
  | 'collection.selected.noRequest.graphql'
  | 'idle.noCollection';

interface InstructionContextInput {
  showHelp: boolean;
  showThemeSelector: boolean;
  showHistoryModal: boolean;
  showResponseModal: boolean;
  showRequestStatsModal: boolean;
  showDocumentModal: boolean;
  activeModal: EditorModal;
  collectionModal: CollectionModal;
  isLoading: boolean;
  currentProtocol: Protocol;
  isStreamingResponse: boolean;
  activeRequestId: string | null;
  focusedArea: FocusArea;
  activeCollectionId: string | null;
}

export const INSTRUCTION_CATALOG: Record<InstructionContextKey, string[]> = {
  'app.blocked.help': [
    'Esc Close modals / go back',
    '↑ / ↓ Navigate collections and requests',
    'Tab Switch focus between panels',
  ],
  'app.blocked.theme': [
    'Esc Close modals / go back',
    'Ctrl+T Change theme',
    'Ctrl+G Open this help panel',
  ],
  'app.blocked.responseModal': [
    'Esc Close modals / go back',
    'Inspect response body and headers',
    'Ctrl+G Open this help panel',
  ],
  'app.blocked.requestStats': [
    'Esc Close modals / go back',
    'Review timings, sizes, and network details',
    'Stats are saved with request history',
  ],
  'app.blocked.document': [
    'Esc Close modals / go back',
    'Tab Switch between Markdown and Preview',
    'Ctrl+S Save request documentation',
  ],
  'app.blocked.history': [
    'Esc Close modals / go back',
    'Type to search by method, URL, status, or body',
    'Enter Open selected request from history',
  ],
  'app.blocked.editorModal.headers': [
    'Esc Close modals / go back',
    'Edit request headers',
    'Ctrl+S Save request changes',
  ],
  'app.blocked.editorModal.body': [
    'Esc Close modals / go back',
    'Edit request body',
    'Ctrl+S Save request changes',
  ],
  'app.blocked.editorModal.query': [
    'Esc Close modals / go back',
    'Edit query parameters',
    'Ctrl+S Save request changes',
  ],
  'app.blocked.editorModal.auth': [
    'Esc Close modals / go back',
    'Edit authentication settings',
    'Ctrl+S Save request changes',
  ],
  'app.blocked.editorModal.scripts': [
    'Esc Close modals / go back',
    'Edit before and after scripts',
    'Use snippets for common script templates',
  ],
  'app.blocked.collectionModal.import': [
    'Esc Close modals / go back',
    'Use Import to create a new collection',
    'Press Enter to confirm inputs',
  ],
  'app.blocked.collectionModal.add': [
    'Esc Close modals / go back',
    'Set method and request name',
    'Quick Curl (Optional) to prefill request',
  ],
  'app.blocked.collectionModal.export': [
    'Esc Close modals / go back',
    'Export selected collection',
    'Ctrl+G Open this help panel',
  ],
  'request.loading.rest': [
    'Sending request...',
    'Wait for response status and body',
    'Space Expand response (when focused)',
  ],
  'request.loading.graphql': [
    'Sending GraphQL request...',
    'Wait for response status and body',
    'Ctrl+S Save request changes',
  ],
  'request.streaming.rest': [
    'Live stream active',
    'Use response controls to disconnect stream',
    'Use response controls to clear stream events',
  ],
  'request.active.rest.request': [
    'URL bar: type an endpoint and press Enter to send',
    'Ctrl+R Request History',
    'Ctrl+D Open request document',
    'Ctrl+S Save request changes',
  ],
  'request.active.rest.response': [
    'Response panel shows status, time, body, and headers',
    'Space Expand response (when focused)',
    'Esc Close modals / go back',
  ],
  'request.active.graphql.request': [
    'Edit query and variables, then send',
    'H / A buttons edit headers or auth',
    'Ctrl+D Open request document',
    'Ctrl+S Save request changes',
  ],
  'request.active.graphql.response': [
    'Response panel shows status, time, body, and headers',
    'Space Expand response (when focused)',
    'Esc Close modals / go back',
  ],
  'collection.selected.noRequest.rest': [
    'Add requests inside a collection to save them for later',
    'Selecting a request automatically loads its configuration',
    'Ctrl+G Open this help panel',
  ],
  'collection.selected.noRequest.graphql': [
    'Add GraphQL requests to this collection',
    'Selecting a request automatically loads its configuration',
    'Ctrl+G Open this help panel',
  ],
  'idle.noCollection': [
    '↑ / ↓ Navigate collections and requests',
    'Ctrl+T Change theme',
    'Ctrl+Q Quit application',
  ],
};

export function getInstructionContextKey(input: InstructionContextInput): InstructionContextKey {
  if (input.showHelp) return 'app.blocked.help';
  if (input.showThemeSelector) return 'app.blocked.theme';
  if (input.showHistoryModal) return 'app.blocked.history';
  if (input.showResponseModal) return 'app.blocked.responseModal';
  if (input.showRequestStatsModal) return 'app.blocked.requestStats';
  if (input.showDocumentModal) return 'app.blocked.document';
  if (input.activeModal) return `app.blocked.editorModal.${input.activeModal}`;
  if (input.collectionModal) return `app.blocked.collectionModal.${input.collectionModal}`;

  if (input.isLoading) {
    return input.currentProtocol === 'graphql' ? 'request.loading.graphql' : 'request.loading.rest';
  }

  if (input.isStreamingResponse) return 'request.streaming.rest';

  if (input.activeRequestId) {
    if (input.currentProtocol === 'graphql') {
      return input.focusedArea === 'response'
        ? 'request.active.graphql.response'
        : 'request.active.graphql.request';
    }

    return input.focusedArea === 'response'
      ? 'request.active.rest.response'
      : 'request.active.rest.request';
  }

  if (input.activeCollectionId) {
    return input.currentProtocol === 'graphql'
      ? 'collection.selected.noRequest.graphql'
      : 'collection.selected.noRequest.rest';
  }

  return 'idle.noCollection';
}
