import { describe, expect, test } from 'bun:test';
import { handleKeyboardShortcut } from './useKeyboardShortcuts';

function createState(overrides: Record<string, unknown> = {}) {
  return {
    showThemeSelector: false,
    showHelp: false,
    showHistoryModal: false,
    showResponseModal: false,
    showRequestStatsModal: false,
    showNotification: false,
    activeModal: null,
    collectionModal: null,
    hasActiveRequest: false,
    hasActiveCollection: false,
    canCopyResponse: false,
    ...overrides,
  };
}

function createActionLog() {
  const calls: string[] = [];
  const actions = {
    setShowThemeSelector: (show: boolean) => calls.push(`setShowThemeSelector:${String(show)}`),
    setShowHelp: (show: boolean) => calls.push(`setShowHelp:${String(show)}`),
    setShowHistoryModal: (show: boolean) => calls.push(`setShowHistoryModal:${String(show)}`),
    setShowResponseModal: (show: boolean) => calls.push(`setShowResponseModal:${String(show)}`),
    setShowRequestStatsModal: (show: boolean) =>
      calls.push(`setShowRequestStatsModal:${String(show)}`),
    setShowNotification: (show: boolean) => calls.push(`setShowNotification:${String(show)}`),
    setActiveModal: (modal: 'headers' | 'body' | 'query' | 'auth' | 'scripts' | null) =>
      calls.push(`setActiveModal:${String(modal)}`),
    setCollectionModal: (modal: 'import' | 'add' | 'export' | null) =>
      calls.push(`setCollectionModal:${String(modal)}`),
    resetHistoryError: () => calls.push('resetHistoryError'),
    onQuit: () => calls.push('onQuit'),
    onOpenHistory: () => calls.push('onOpenHistory'),
    onSaveRequest: () => calls.push('onSaveRequest'),
    onCopyResponse: () => calls.push('onCopyResponse'),
  };

  return { actions, calls };
}

describe('handleKeyboardShortcut', () => {
  test('opens help on Ctrl+G when UI is not blocked', () => {
    const { actions, calls } = createActionLog();

    handleKeyboardShortcut({ ctrl: true, name: 'g' }, createState(), actions);

    expect(calls).toEqual(['setShowHelp:true']);
  });

  test('does not open help on Ctrl+G when modal is active', () => {
    const { actions, calls } = createActionLog();

    handleKeyboardShortcut({ ctrl: true, name: 'g' }, createState({ showHelp: true }), actions);

    expect(calls).toEqual([]);
  });

  test('opens history on Ctrl+R when UI is not blocked', () => {
    const { actions, calls } = createActionLog();

    handleKeyboardShortcut({ ctrl: true, name: 'r' }, createState(), actions);

    expect(calls).toEqual(['resetHistoryError', 'setShowHistoryModal:true', 'onOpenHistory']);
  });

  test('saves request on Ctrl+S only when active request and collection exist', () => {
    const { actions, calls } = createActionLog();

    handleKeyboardShortcut(
      { ctrl: true, name: 's' },
      createState({ hasActiveRequest: true, hasActiveCollection: true }),
      actions,
    );

    expect(calls).toEqual(['onSaveRequest']);
  });

  test('copies response on Ctrl+C only when response copy is allowed', () => {
    const { actions, calls } = createActionLog();

    handleKeyboardShortcut(
      { ctrl: true, name: 'c' },
      createState({ canCopyResponse: true }),
      actions,
    );

    expect(calls).toEqual(['onCopyResponse']);
  });

  test('closes currently open editor modal on Escape', () => {
    const { actions, calls } = createActionLog();

    handleKeyboardShortcut(
      { ctrl: false, name: 'escape' },
      createState({ activeModal: 'headers' }),
      actions,
    );

    expect(calls).toEqual(['setActiveModal:null']);
  });

  test('closes notification on Escape', () => {
    const { actions, calls } = createActionLog();

    handleKeyboardShortcut(
      { ctrl: false, name: 'escape' },
      createState({ showNotification: true }),
      actions,
    );

    expect(calls).toEqual(['setShowNotification:false']);
  });
});
