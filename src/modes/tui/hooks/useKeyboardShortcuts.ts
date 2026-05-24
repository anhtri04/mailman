import { useKeyboard } from '@opentui/react';

type EditorModal = 'headers' | 'body' | 'query' | 'auth' | 'scripts' | null;
type CollectionModal = 'import' | 'add' | 'export' | null;

interface UseKeyboardShortcutsState {
  showThemeSelector: boolean;
  showHelp: boolean;
  showHistoryModal: boolean;
  showResponseModal: boolean;
  showRequestStatsModal: boolean;
  showNotification: boolean;
  activeModal: EditorModal;
  collectionModal: CollectionModal;
  hasActiveRequest: boolean;
  hasActiveCollection: boolean;
  canCopyResponse: boolean;
}

interface UseKeyboardShortcutsActions {
  setShowThemeSelector: (show: boolean) => void;
  setShowHelp: (show: boolean) => void;
  setShowHistoryModal: (show: boolean) => void;
  setShowResponseModal: (show: boolean) => void;
  setShowRequestStatsModal: (show: boolean) => void;
  setShowNotification: (show: boolean) => void;
  setActiveModal: (modal: EditorModal) => void;
  setCollectionModal: (modal: CollectionModal) => void;
  resetHistoryError: () => void;
  onQuit: () => void;
  onOpenHistory: () => void;
  onSaveRequest: () => void;
  onCopyResponse: () => void;
}

interface KeyboardShortcutKey {
  ctrl?: boolean;
  name?: string;
}

function isInteractionBlocked(state: UseKeyboardShortcutsState): boolean {
  return (
    state.showThemeSelector ||
    state.showHelp ||
    state.showHistoryModal ||
    state.showResponseModal ||
    state.showRequestStatsModal ||
    state.showNotification ||
    state.activeModal !== null ||
    state.collectionModal !== null
  );
}

export function useKeyboardShortcuts(
  state: UseKeyboardShortcutsState,
  actions: UseKeyboardShortcutsActions,
): void {
  useKeyboard((key) => {
    handleKeyboardShortcut(key, state, actions);
  });
}

export function handleKeyboardShortcut(
  key: KeyboardShortcutKey,
  state: UseKeyboardShortcutsState,
  actions: UseKeyboardShortcutsActions,
): void {
  if (key.name === 'escape') {
    // ThemeSelector owns Escape so it can cancel previewed theme changes before closing.
    if (state.showThemeSelector) {
      return;
    }

    if (state.showHelp) {
      actions.setShowHelp(false);
      return;
    }

    if (state.showHistoryModal) {
      actions.setShowHistoryModal(false);
      actions.resetHistoryError();
      return;
    }

    if (state.showResponseModal) {
      actions.setShowResponseModal(false);
      return;
    }

    if (state.showRequestStatsModal) {
      actions.setShowRequestStatsModal(false);
      return;
    }

    if (state.showNotification) {
      actions.setShowNotification(false);
      return;
    }

    if (state.activeModal) {
      actions.setActiveModal(null);
      return;
    }

    if (state.collectionModal) {
      actions.setCollectionModal(null);
    }

    return;
  }

  if (key.ctrl && key.name === 'g') {
    if (!isInteractionBlocked(state)) {
      actions.setShowHelp(true);
    }
    return;
  }

  if (key.ctrl && key.name === 't' && !isInteractionBlocked(state)) {
    actions.setShowThemeSelector(true);
    return;
  }

  if (key.ctrl && key.name === 'q') {
    actions.onQuit();
    return;
  }

  if (key.ctrl && key.name === 'r') {
    if (!isInteractionBlocked(state)) {
      actions.resetHistoryError();
      actions.setShowHistoryModal(true);
      actions.onOpenHistory();
    }
    return;
  }

  if (key.ctrl && key.name === 's') {
    if (state.hasActiveRequest && state.hasActiveCollection) {
      actions.onSaveRequest();
    }
    return;
  }

  if (key.ctrl && key.name === 'c' && state.canCopyResponse) {
    actions.onCopyResponse();
  }
}
