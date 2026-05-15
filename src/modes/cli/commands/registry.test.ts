import { describe, expect, test } from 'bun:test';
import { getCommands, resolveCommand } from './registry';

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
});
