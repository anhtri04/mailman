import { useCallback, useEffect, useState } from 'react';
import { useKeyboard } from '@opentui/react';
import { loadCollections, loadHistory, sendRequest } from '../../core/services';
import { HistoryModal, Modal, SettingsModal, ThemeSelector } from '../../shared/components';
import type { HistoryEntry, RequestOptions } from '../../core/types';
import { CliInput } from './components/CliInput';
import { CliOutput } from './components/CliOutput';
import { InputSuggestionPanel } from './components/InputSuggestionPanel';
import { getCommands, resolveCommand } from './commands/registry';
import { useInputSuggestions } from './hooks/useInputSuggestions';
import { useCliState } from './hooks/useCliState';
import { useCliKeyboardNavigation } from './hooks/useCliKeyboardNavigation';
import { parseUnifiedInput } from './parser/unifiedInputParser';
import { handleShellCommand } from './shell/handlers';
import { renderVirtualPath } from './shell/virtualFs';
import { renderSystemMessage } from './render/systemMessage';
import { appendCliHistoryEntry } from './utils/history';

export function CliApp() {
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const { state, setState, pushOutput, pushResponseOutput } = useCliState();
  const keyboardNavigation = useCliKeyboardNavigation({
    outputs: state.outputs,
    toggles: state.toggles,
  });
  const commands = getCommands();
  const suggestions = useInputSuggestions({
    input: state.input,
    commands,
    collections: state.collections,
    virtualPath: state.virtualPath,
  });
  const prompt = renderVirtualPath(state.virtualPath, state.collections);

  useEffect(() => {
    void (async () => {
      const collections = await loadCollections();
      setState((prev) => ({ ...prev, collections }));
    })();
  }, [setState]);

  useEffect(() => {
    setShowSuggestions(true);
  }, [state.input, suggestions.suggestions.length]);

  const cleanExit = useCallback(() => {
    const exit = (globalThis as { __mailmanCleanExit?: () => void }).__mailmanCleanExit;
    if (exit) exit();
  }, []);

  const openHistory = useCallback(async () => {
    setHistoryError(null);
    const entries = await loadHistory();
    setHistoryEntries(entries);
    setShowHistoryModal(true);
  }, []);

  const openSettings = useCallback(() => {
    setShowSettingsModal(true);
  }, []);

  const requestFromHistoryEntry = useCallback((entry: HistoryEntry): RequestOptions => {
    return {
      method: entry.request.method,
      url: entry.request.url,
      headers: entry.request.headers,
      body: entry.request.body,
      auth: entry.request.auth,
      scripts: entry.request.scripts,
    };
  }, []);

  const openHistoryEntry = useCallback(
    (entry: HistoryEntry) => {
      const request = requestFromHistoryEntry(entry);
      const protocol = entry.response.mode === 'sse' ? 'sse' : entry.protocol;
      setState((prev) => ({
        ...prev,
        activeCollectionId: entry.collectionId ?? prev.activeCollectionId,
        activeRequest: request,
        lastResponse: entry.response,
      }));
      pushResponseOutput(entry.response, {
        protocol: protocol === 'websocket' ? 'rest' : protocol,
        method: entry.request.method,
        url: entry.request.url,
      });
      setHistoryError(null);
      setShowHistoryModal(false);
    },
    [pushResponseOutput, requestFromHistoryEntry, setState],
  );

  const reportHistorySaveError = useCallback(
    (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      pushOutput('error', `Failed to save history: ${message}`);
    },
    [pushOutput],
  );

  const submitInput = useCallback(
    async (rawInput?: string) => {
      const raw = (rawInput ?? state.input).trim();
      if (!raw) return;

      setState((prev) => ({
        ...prev,
        input: '',
        history: [...prev.history, raw],
        historyIndex: null,
      }));

      pushOutput('request', `> ${raw}`);

      try {
        const parsed = parseUnifiedInput(raw);

        if (parsed.kind === 'command') {
          const command = resolveCommand(parsed.name, commands);
          if (!command) {
            pushOutput('error', `Unknown command: /${parsed.name || ''}. Try /help.`);
            return;
          }

          const result = await command.handler(parsed.args, {
            state,
            setState,
            cleanExit,
            openThemeSelector: () => setShowThemeSelector(true),
            openHistory,
            openSettings,
          });

          if (result.error) {
            pushOutput('error', result.error);
          }
          if (result.message) {
            pushOutput('system', renderSystemMessage(result.message));
          }
          return;
        }

        if (parsed.kind === 'shell') {
          const result = await handleShellCommand(parsed, {
            state,
            setState,
          });

          if (result.error) {
            pushOutput('error', result.error);
            return;
          }
          if (result.message) {
            pushOutput('system', result.message);
          }
          if (!result.request) return;

          setState((prev) => ({ ...prev, isLoading: true, activeRequest: result.request! }));
          const response = await sendRequest(result.request);
          void appendCliHistoryEntry(result.request, response, {
            protocol: result.protocol ?? 'rest',
            collectionId: result.collectionId,
            requestId: result.requestId,
            requestName: result.requestName,
          }).catch(reportHistorySaveError);
          setState((prev) => ({ ...prev, isLoading: false, lastResponse: response }));
          pushResponseOutput(response, {
            protocol: result.protocol ?? 'rest',
            method: result.request.method,
            url: result.request.url,
          });
          return;
        }

        setState((prev) => ({ ...prev, isLoading: true, activeRequest: parsed.request }));
        const response = await sendRequest(parsed.request);
        void appendCliHistoryEntry(parsed.request, response, {
          protocol: parsed.protocol ?? 'rest',
        }).catch(reportHistorySaveError);
        setState((prev) => ({ ...prev, isLoading: false, lastResponse: response }));
        pushResponseOutput(response, {
          protocol: parsed.protocol ?? 'rest',
          method: parsed.request.method,
          url: parsed.request.url,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setState((prev) => ({ ...prev, isLoading: false }));
        pushOutput('error', message);
      }
    },
    [
      cleanExit,
      commands,
      openHistory,
      openSettings,
      pushOutput,
      pushResponseOutput,
      reportHistorySaveError,
      setState,
      state,
      state.input,
    ],
  );

  useKeyboard((key) => {
    if (key.ctrl && key.name === 'q') {
      cleanExit();
      return;
    }

    if (suggestions.visible && showSuggestions) {
      if (key.name === 'escape') {
        setShowSuggestions(false);
        return;
      }
    }

    if (showHistoryModal) {
      if (key.name === 'escape') {
        setShowHistoryModal(false);
        setHistoryError(null);
      }
      return;
    }

    if (showSettingsModal) {
      if (key.name === 'escape') {
        setShowSettingsModal(false);
      }
      return;
    }

    if (showThemeSelector) {
      return;
    }

    if (key.ctrl && key.name === 'g') {
      keyboardNavigation.focusInput();
      return;
    }

    if (key.ctrl && key.name === 'o') {
      keyboardNavigation.focusOutput();
      return;
    }

    if (key.ctrl && key.name === 'l') {
      setState((prev) => ({ ...prev, outputs: [] }));
      keyboardNavigation.resetOutputNavigation();
      return;
    }

    if (keyboardNavigation.focusedPanel === 'output') {
      if (key.name === 'escape') {
        keyboardNavigation.focusInput();
        return;
      }

      if (key.name === 'tab') {
        keyboardNavigation.moveResponseSelection(key.shift ? -1 : 1);
        return;
      }

      if (key.ctrl && key.name === 'up') {
        keyboardNavigation.moveResponseSelection(-1);
        return;
      }

      if (key.ctrl && key.name === 'down') {
        keyboardNavigation.moveResponseSelection(1);
        return;
      }

      if (key.name === 'up') {
        keyboardNavigation.moveSectionSelection(-1);
        return;
      }

      if (key.name === 'down') {
        keyboardNavigation.moveSectionSelection(1);
        return;
      }

      if (key.name === 'left') {
        keyboardNavigation.setSectionCollapsed(
          keyboardNavigation.selectedResponseId,
          keyboardNavigation.selectedSectionId,
          true,
        );
        return;
      }

      if (key.name === 'right') {
        keyboardNavigation.setSectionCollapsed(
          keyboardNavigation.selectedResponseId,
          keyboardNavigation.selectedSectionId,
          false,
        );
        return;
      }

      if (key.name === 'space' || key.name === 'return' || key.name === 'enter') {
        keyboardNavigation.toggleSection(
          keyboardNavigation.selectedResponseId,
          keyboardNavigation.selectedSectionId,
        );
        return;
      }

      return;
    }

    if (key.name === 'return' || key.name === 'enter') {
      const selection = suggestions.visible && showSuggestions ? suggestions.selectForEnter() : null;
      if (selection) {
        if (selection.executeNow) {
          void submitInput(selection.nextInput);
        } else {
          const nextInput = selection.nextInput;
          if (!nextInput) return;
          setState((prev) => ({ ...prev, input: nextInput, historyIndex: null }));
        }
        return;
      }

      void submitInput();
      return;
    }

    if (key.name === 'tab') {
      const completedInput = suggestions.visible && showSuggestions ? suggestions.autocompleteInput() : null;
      if (!completedInput) return;

      setState((prev) => ({ ...prev, input: completedInput, historyIndex: null }));
      return;
    }

    if (key.name === 'up') {
      if (suggestions.visible && showSuggestions) {
        suggestions.moveSelectionUp();
        return;
      }

      setState((prev) => {
        if (prev.history.length === 0) return prev;
        const nextIndex =
          prev.historyIndex === null ? prev.history.length - 1 : Math.max(0, prev.historyIndex - 1);
        const nextInput = prev.history[nextIndex] ?? prev.input;
        return { ...prev, historyIndex: nextIndex, input: nextInput };
      });
      return;
    }

    if (key.name === 'down') {
      if (suggestions.visible && showSuggestions) {
        suggestions.moveSelectionDown();
        return;
      }

      setState((prev) => {
        if (prev.history.length === 0 || prev.historyIndex === null) return prev;
        const nextIndex = prev.historyIndex + 1;
        if (nextIndex >= prev.history.length) {
          return { ...prev, historyIndex: null, input: '' };
        }
        const nextInput = prev.history[nextIndex] ?? '';
        return { ...prev, historyIndex: nextIndex, input: nextInput };
      });
    }
  });

  return (
    <box
      style={{
        position: 'relative',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        padding: 0,
        gap: 0,
      }}
    >
      <CliOutput
        outputs={state.outputs}
        toggles={state.toggles}
        focused={
          keyboardNavigation.focusedPanel === 'output' &&
          !showThemeSelector &&
          !showHistoryModal &&
          !showSettingsModal
        }
        selectedResponseId={keyboardNavigation.selectedResponseId}
        selectedSectionId={keyboardNavigation.selectedSectionId}
        onFocus={keyboardNavigation.focusOutput}
        onResponseFocus={keyboardNavigation.focusResponse}
        onSectionFocus={keyboardNavigation.focusSection}
        onToggleSection={(responseId, sectionId, defaultCollapsed) =>
          keyboardNavigation.toggleSection(responseId, sectionId, defaultCollapsed)
        }
        isSectionCollapsed={keyboardNavigation.isSectionCollapsed}
      />
      <CliInput
        value={state.input}
        prompt={prompt}
        focused={
          keyboardNavigation.focusedPanel === 'input' &&
          !showThemeSelector &&
          !showHistoryModal &&
          !showSettingsModal
        }
        onChange={(value) => setState((prev) => ({ ...prev, input: value }))}
        onFocus={keyboardNavigation.focusInput}
      />
      <InputSuggestionPanel
        visible={
          !showThemeSelector && !showHistoryModal && !showSettingsModal && suggestions.visible && showSuggestions
        }
        onClose={() => setShowSuggestions(false)}
        suggestions={suggestions.suggestions}
        selectedIndex={suggestions.selectedIndex}
      />
      <Modal
        isOpen={showHistoryModal}
        onClose={() => {
          setShowHistoryModal(false);
          setHistoryError(null);
        }}
        title="Request History"
        subtitle={`${historyEntries.length} entries`}
      >
        <HistoryModal
          entries={historyEntries}
          onOpenEntry={openHistoryEntry}
          errorMessage={historyError}
          allowSnapshotOpen={true}
        />
      </Modal>
      <ThemeSelector isOpen={showThemeSelector} onClose={() => setShowThemeSelector(false)} />
      <SettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} />
    </box>
  );
}
