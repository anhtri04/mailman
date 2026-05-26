import { useCallback, useEffect } from 'react';
import { useKeyboard } from '@opentui/react';
import { loadCollections, sendRequest } from '../../core/services';
import { CliInput } from './components/CliInput';
import { CliOutput } from './components/CliOutput';
import { InputSuggestionPanel } from './components/InputSuggestionPanel';
import { getCommands, resolveCommand } from './commands/registry';
import { useInputSuggestions } from './hooks/useInputSuggestions';
import { useCliState } from './hooks/useCliState';
import { parseUnifiedInput } from './parser/unifiedInputParser';
import { renderResponseBlock } from './render/responseBlock';
import { handleShellCommand } from './shell/handlers';
import { renderVirtualPath } from './shell/virtualFs';
import { renderSystemMessage } from './render/systemMessage';

export function CliApp() {
  const { state, setState, pushOutput } = useCliState();
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

  const cleanExit = useCallback(() => {
    const exit = (globalThis as { __mailmanCleanExit?: () => void }).__mailmanCleanExit;
    if (exit) exit();
  }, []);

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
          const responseText = renderResponseBlock(response, state.toggles, {
            method: result.request.method,
            url: result.request.url,
          });
          setState((prev) => ({ ...prev, isLoading: false, lastResponse: response }));
          pushOutput('response', responseText);
          return;
        }

        setState((prev) => ({ ...prev, isLoading: true, activeRequest: parsed.request }));
        const response = await sendRequest(parsed.request);
        const responseText = renderResponseBlock(response, state.toggles, {
          method: parsed.request.method,
          url: parsed.request.url,
        });
        setState((prev) => ({ ...prev, isLoading: false, lastResponse: response }));
        pushOutput('response', responseText);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setState((prev) => ({ ...prev, isLoading: false }));
        pushOutput('error', message);
      }
    },
    [cleanExit, commands, pushOutput, setState, state, state.input, state.toggles],
  );

  useKeyboard((key) => {
    if (key.ctrl && key.name === 'q') {
      cleanExit();
      return;
    }

    if (key.ctrl && key.name === 'l') {
      setState((prev) => ({ ...prev, outputs: [] }));
      return;
    }

    if (key.name === 'return' || key.name === 'enter') {
      const selection = suggestions.selectForEnter();
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
      const completedInput = suggestions.autocompleteInput();
      if (!completedInput) return;

      setState((prev) => ({ ...prev, input: completedInput, historyIndex: null }));
      return;
    }

    if (key.name === 'up') {
      if (suggestions.visible) {
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
      if (suggestions.visible) {
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
    <box style={{ flexDirection: 'column', height: '100%', padding: 1, gap: 0.5 }}>
      <CliOutput outputs={state.outputs} />
      <InputSuggestionPanel
        visible={suggestions.visible}
        suggestions={suggestions.suggestions}
        selectedIndex={suggestions.selectedIndex}
      />
      <CliInput
        value={state.input}
        prompt={prompt}
        onChange={(value) => setState((prev) => ({ ...prev, input: value }))}
      />
    </box>
  );
}
