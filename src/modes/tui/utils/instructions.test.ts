import { describe, expect, test } from 'bun:test';
import { getInstructionContextKey } from './instructions';

describe('getInstructionContextKey', () => {
  test('returns help context when help modal is open', () => {
    const key = getInstructionContextKey({
      showHelp: true,
      showThemeSelector: false,
      showHistoryModal: false,
      showResponseModal: false,
      showRequestStatsModal: false,
      showDocumentModal: false,
      activeModal: null,
      collectionModal: null,
      isLoading: false,
      currentProtocol: 'rest',
      isStreamingResponse: false,
      activeRequestId: null,
      focusedArea: null,
      activeCollectionId: null,
    });

    expect(key).toBe('app.blocked.help');
  });

  test('returns graphql response context when request is active and response focused', () => {
    const key = getInstructionContextKey({
      showHelp: false,
      showThemeSelector: false,
      showHistoryModal: false,
      showResponseModal: false,
      showRequestStatsModal: false,
      showDocumentModal: false,
      activeModal: null,
      collectionModal: null,
      isLoading: false,
      currentProtocol: 'graphql',
      isStreamingResponse: false,
      activeRequestId: 'r1',
      focusedArea: 'response',
      activeCollectionId: 'c1',
    });

    expect(key).toBe('request.active.graphql.response');
  });

  test('returns document context when document modal is open', () => {
    const key = getInstructionContextKey({
      showHelp: false,
      showThemeSelector: false,
      showHistoryModal: false,
      showResponseModal: false,
      showRequestStatsModal: false,
      showDocumentModal: true,
      activeModal: null,
      collectionModal: null,
      isLoading: false,
      currentProtocol: 'rest',
      isStreamingResponse: false,
      activeRequestId: 'r1',
      focusedArea: 'request',
      activeCollectionId: 'c1',
    });

    expect(key).toBe('app.blocked.document');
  });

  test('returns idle context when nothing is selected', () => {
    const key = getInstructionContextKey({
      showHelp: false,
      showThemeSelector: false,
      showHistoryModal: false,
      showResponseModal: false,
      showRequestStatsModal: false,
      showDocumentModal: false,
      activeModal: null,
      collectionModal: null,
      isLoading: false,
      currentProtocol: 'rest',
      isStreamingResponse: false,
      activeRequestId: null,
      focusedArea: null,
      activeCollectionId: null,
    });

    expect(key).toBe('idle.noCollection');
  });
});
