import { describe, expect, test } from 'bun:test';
import type { CliCommand } from '../commands/registry';
import {
  autocompleteSelection,
  commandMatchBase,
  commandRequiresArgs,
  filterCommands,
  isPaletteVisible,
  nextSelectionDown,
  nextSelectionUp,
  selectCommandForEnter,
} from './useCommandPalette';

const commands: CliCommand[] = [
  {
    name: 'help',
    aliases: ['h'],
    description: 'Show available commands',
    usage: '/help',
    handler: () => ({ message: 'ok' }),
  },
  {
    name: 'show',
    aliases: [],
    description: 'Show response section',
    usage: '/show body|headers|meta',
    handler: () => ({ message: 'ok' }),
  },
  {
    name: 'use',
    aliases: [],
    description: 'Set active collection',
    usage: '/use <id|name>',
    handler: () => ({ message: 'ok' }),
  },
];

describe('useCommandPalette helpers', () => {
  test('filters by command name and alias', () => {
    expect(filterCommands('/he', commands).map((cmd) => cmd.name)).toEqual(['help']);
    expect(filterCommands('/h', commands).map((cmd) => cmd.name)).toEqual(['help', 'show']);
  });

  test('extracts command base from input', () => {
    expect(commandMatchBase('/show body')).toBe('show');
    expect(commandMatchBase('/  help')).toBe('help');
    expect(commandMatchBase('/')).toBe('');
  });

  test('computes visibility with dismissed command base', () => {
    const filtered = filterCommands('/show', commands);
    expect(isPaletteVisible('/show', filtered, null)).toBe(true);
    expect(isPaletteVisible('/show ', filtered, 'show')).toBe(false);
    expect(isPaletteVisible('/use ', filtered, 'show')).toBe(true);
    expect(isPaletteVisible('GET https://example.com', filtered, null)).toBe(false);
  });

  test('moves selection up and down with wrapping', () => {
    expect(nextSelectionUp(0, 3)).toBe(2);
    expect(nextSelectionUp(2, 3)).toBe(1);
    expect(nextSelectionDown(2, 3)).toBe(0);
    expect(nextSelectionDown(0, 3)).toBe(1);
  });

  test('autocompletes selected command with trailing space', () => {
    const filtered = filterCommands('/sh', commands);
    const result = autocompleteSelection(true, filtered, 0);

    expect(result).toEqual({
      nextInput: '/show ',
      dismissedBase: 'show',
    });
    expect(autocompleteSelection(false, filtered, 0)).toBeNull();
  });

  test('enter selection executes no-arg commands immediately', () => {
    const filtered = filterCommands('/he', commands);
    const result = selectCommandForEnter(true, filtered, 0);

    expect(commandRequiresArgs(filtered[0] as CliCommand)).toBe(false);
    expect(result).toEqual({ executeNow: true, nextInput: '/help' });
  });

  test('regression: enter on help selection from exact slash input', () => {
    const filtered = filterCommands('/', commands);
    expect(filtered[0]?.name).toBe('help');

    const result = selectCommandForEnter(true, filtered, 0);
    expect(result).toEqual({ executeNow: true, nextInput: '/help' });
  });

  test('enter selection fills input for arg-required commands', () => {
    const filtered = filterCommands('/sh', commands);
    const result = selectCommandForEnter(true, filtered, 0);

    expect(commandRequiresArgs(filtered[0] as CliCommand)).toBe(true);
    expect(result).toEqual({
      executeNow: false,
      nextInput: '/show ',
      dismissedBase: 'show',
    });
  });
});
