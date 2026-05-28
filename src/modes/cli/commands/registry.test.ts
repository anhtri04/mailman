import { describe, expect, test } from 'bun:test';
import { getCommands, resolveCommand } from './registry';
import type { CommandContext } from './registry';

describe('command registry', () => {
  test('resolves command by name', () => {
    const commands = getCommands();
    const cmd = resolveCommand('help', commands);
    expect(cmd?.name).toBe('help');
  });

  test('resolves command by alias', () => {
    const commands = getCommands();
    const cmd = resolveCommand('q', commands);
    expect(cmd?.name).toBe('exit');
  });

  test('returns null for unknown command', () => {
    const commands = getCommands();
    const cmd = resolveCommand('missing', commands);
    expect(cmd).toBeNull();
  });

  test('opens history command', async () => {
    const commands = getCommands();
    const cmd = resolveCommand('history', commands);
    let opened = false;
    const ctx = {
      state: {},
      setState: () => {},
      cleanExit: () => {},
      openThemeSelector: () => {},
      openHistory: () => {
        opened = true;
      },
      openSettings: () => {},
    } as unknown as CommandContext;

    const result = await cmd?.handler([], ctx);
    expect(opened).toBe(true);
    expect(result?.message).toBe('Opening request history.');
  });

  test('opens settings command', async () => {
    const commands = getCommands();
    const cmd = resolveCommand('settings', commands);
    let opened = false;
    const ctx = {
      state: {},
      setState: () => {},
      cleanExit: () => {},
      openThemeSelector: () => {},
      openHistory: () => {},
      openSettings: () => {
        opened = true;
      },
    } as unknown as CommandContext;

    const result = await cmd?.handler([], ctx);
    expect(opened).toBe(true);
    expect(result?.message).toBe('Opening settings panel.');
  });
});
