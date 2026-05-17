import { useEffect, useMemo, useState } from 'react';
import type { Collection } from '../../../core/types';
import type { CliCommand } from '../commands/registry';
import { analyzeUnifiedInput, type InputSuggestion } from '../parser/suggestions';

export interface SuggestionSelectionResult {
  executeNow: boolean;
  nextInput?: string;
}

interface UseInputSuggestionsArgs {
  input: string;
  commands: CliCommand[];
  collections: Collection[];
}

interface UseInputSuggestionsResult {
  visible: boolean;
  suggestions: InputSuggestion[];
  selectedIndex: number;
  canSubmit: boolean;
  moveSelectionUp: () => void;
  moveSelectionDown: () => void;
  autocompleteInput: () => string | null;
  selectForEnter: () => SuggestionSelectionResult | null;
}

function nextSelectionUp(currentIndex: number, listLength: number): number {
  if (listLength <= 0) return 0;
  return currentIndex === 0 ? listLength - 1 : currentIndex - 1;
}

function nextSelectionDown(currentIndex: number, listLength: number): number {
  if (listLength <= 0) return 0;
  return (currentIndex + 1) % listLength;
}

function applySuggestion(input: string, suggestion: InputSuggestion): string {
  const inserted = `${suggestion.insertText}${suggestion.appendSpace ? ' ' : ''}`;
  return `${input.slice(0, suggestion.replacementStart)}${inserted}${input.slice(suggestion.replacementEnd)}`;
}

export function useInputSuggestions({
  input,
  commands,
  collections,
}: UseInputSuggestionsArgs): UseInputSuggestionsResult {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const analysis = useMemo(
    () => analyzeUnifiedInput(input, { commands, collections }),
    [collections, commands, input],
  );

  const suggestions = analysis.suggestions;
  const visible = suggestions.length > 0;

  useEffect(() => {
    setSelectedIndex(0);
  }, [input]);

  useEffect(() => {
    if (selectedIndex >= suggestions.length) {
      setSelectedIndex(0);
    }
  }, [selectedIndex, suggestions.length]);

  const moveSelectionUp = () => {
    if (!visible) return;
    setSelectedIndex((prev) => nextSelectionUp(prev, suggestions.length));
  };

  const moveSelectionDown = () => {
    if (!visible) return;
    setSelectedIndex((prev) => nextSelectionDown(prev, suggestions.length));
  };

  const autocompleteInput = (): string | null => {
    const selected = suggestions[selectedIndex];
    if (!visible || !selected) return null;
    return applySuggestion(input, selected);
  };

  const selectForEnter = (): SuggestionSelectionResult | null => {
    const selected = suggestions[selectedIndex];
    if (!visible || !selected) return null;

    if (analysis.canSubmit && !selected.executeOnEnter) {
      return null;
    }

    const nextInput = applySuggestion(input, selected).trimEnd();
    if (selected.executeOnEnter) {
      return { executeNow: true, nextInput };
    }

    return { executeNow: false, nextInput: `${nextInput} ` };
  };

  return {
    visible,
    suggestions,
    selectedIndex,
    canSubmit: analysis.canSubmit,
    moveSelectionUp,
    moveSelectionDown,
    autocompleteInput,
    selectForEnter,
  };
}
