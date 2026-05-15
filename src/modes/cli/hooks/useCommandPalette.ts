import { useEffect, useMemo, useState } from 'react';
import type { CliCommand } from '../commands/registry';

export interface EnterSelectionResult {
  executeNow: boolean;
  nextInput?: string;
}

interface UseCommandPaletteResult {
  visible: boolean;
  filtered: CliCommand[];
  selectedIndex: number;
  moveSelectionUp: () => void;
  moveSelectionDown: () => void;
  autocompleteInput: () => string | null;
  selectForEnter: () => EnterSelectionResult | null;
}

export function commandRequiresArgs(command: CliCommand): boolean {
  const usage = command.usage.trim();
  return usage.includes(' ');
}

export function commandMatchBase(input: string): string {
  const value = input.slice(1).trim();
  const firstToken = value.split(/\s+/)[0] ?? '';
  return firstToken.toLowerCase();
}

export function filterCommands(input: string, commands: CliCommand[]): CliCommand[] {
  const query = input.slice(1).trim().toLowerCase();
  return commands
    .filter((cmd) => cmd.name.includes(query) || cmd.aliases.some((alias) => alias.includes(query)))
    .slice(0, 6);
}

export function isPaletteVisible(
  input: string,
  filtered: CliCommand[],
  dismissedCommandBase: string | null,
): boolean {
  if (!input.startsWith('/') || filtered.length === 0) return false;
  if (!dismissedCommandBase) return true;
  return commandMatchBase(input) !== dismissedCommandBase;
}

export function nextSelectionUp(currentIndex: number, listLength: number): number {
  if (listLength <= 0) return 0;
  return currentIndex === 0 ? listLength - 1 : currentIndex - 1;
}

export function nextSelectionDown(currentIndex: number, listLength: number): number {
  if (listLength <= 0) return 0;
  return (currentIndex + 1) % listLength;
}

export function autocompleteSelection(
  visible: boolean,
  filtered: CliCommand[],
  selectedIndex: number,
): { nextInput: string; dismissedBase: string } | null {
  if (!visible) return null;
  const selected = filtered[selectedIndex] ?? null;
  if (!selected) return null;
  return { nextInput: `/${selected.name} `, dismissedBase: selected.name };
}

export function selectCommandForEnter(
  visible: boolean,
  filtered: CliCommand[],
  selectedIndex: number,
): (EnterSelectionResult & { dismissedBase?: string }) | null {
  if (!visible) return null;
  const selected = filtered[selectedIndex] ?? null;
  if (!selected) return null;

  if (commandRequiresArgs(selected)) {
    return {
      executeNow: false,
      nextInput: `/${selected.name} `,
      dismissedBase: selected.name,
    };
  }

  return { executeNow: true, nextInput: `/${selected.name}` };
}

export function useCommandPalette(input: string, commands: CliCommand[]): UseCommandPaletteResult {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [dismissedCommandBase, setDismissedCommandBase] = useState<string | null>(null);

  const currentBase = commandMatchBase(input);

  const filtered = useMemo(() => filterCommands(input, commands), [commands, input]);

  useEffect(() => {
    if (!input.startsWith('/')) {
      setDismissedCommandBase(null);
      return;
    }

    if (dismissedCommandBase && currentBase !== dismissedCommandBase) {
      setDismissedCommandBase(null);
    }
  }, [currentBase, dismissedCommandBase, input]);

  useEffect(() => {
    if (selectedIndex >= filtered.length) {
      setSelectedIndex(0);
    }
  }, [filtered.length, selectedIndex]);

  const visible = isPaletteVisible(input, filtered, dismissedCommandBase);

  const moveSelectionUp = () => {
    if (!visible || filtered.length === 0) return;
    setSelectedIndex((prev) => nextSelectionUp(prev, filtered.length));
  };

  const moveSelectionDown = () => {
    if (!visible || filtered.length === 0) return;
    setSelectedIndex((prev) => nextSelectionDown(prev, filtered.length));
  };

  const autocompleteInput = (): string | null => {
    const result = autocompleteSelection(visible, filtered, selectedIndex);
    if (!result) return null;
    setDismissedCommandBase(result.dismissedBase);
    return result.nextInput;
  };

  const selectForEnter = (): EnterSelectionResult | null => {
    const result = selectCommandForEnter(visible, filtered, selectedIndex);
    if (!result) return null;
    if (result.dismissedBase) {
      setDismissedCommandBase(result.dismissedBase);
    }
    return { executeNow: result.executeNow, nextInput: result.nextInput };
  };

  return {
    visible,
    filtered,
    selectedIndex,
    moveSelectionUp,
    moveSelectionDown,
    autocompleteInput,
    selectForEnter,
  };
}
