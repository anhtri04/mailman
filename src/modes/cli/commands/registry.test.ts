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

  test('resolves editor commands', () => {
    const commands = getCommands();
    expect(resolveCommand('header', commands)?.name).toBe('header');
    expect(resolveCommand('variables', commands)?.name).toBe('variable');
    expect(resolveCommand('save', commands)?.name).toBe('save');
  });

  test('editor commands require current request path', async () => {
    const commands = getCommands();
    const cmd = resolveCommand('header', commands);
    let opened = false;
    const ctx = {
      state: {
        virtualPath: { kind: 'root' },
        collections: [],
      },
      setState: () => {},
      cleanExit: () => {},
      openThemeSelector: () => {},
      openHistory: () => {},
      openSettings: () => {},
      openEditor: () => {
        opened = true;
      },
      saveActiveRequest: async () => ({}),
    } as unknown as CommandContext;

    const result = await cmd?.handler([], ctx);
    expect(opened).toBe(false);
    expect(result?.error).toContain('inside a request path');
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
