import type { CliSessionState } from '../types';
import { buildCollectionsCommands } from './handlers/collections';
import { buildCoreCommands } from './handlers/core';

export interface CommandContext {
  state: CliSessionState;
  setState: (updater: (prev: CliSessionState) => CliSessionState) => void;
  cleanExit: () => void;
}

export interface CommandResult {
  message?: string;
  error?: string;
}

export interface CliCommandArgSpec {
  name: string;
  required: boolean;
  repeatable?: boolean;
  values?: string[];
  dynamicValues?: 'commands' | 'collections' | 'requests';
  description?: string;
}

export interface CliCommand {
  name: string;
  aliases: string[];
  description: string;
  usage: string;
  argsSpec?: CliCommandArgSpec[];
  handler: (args: string[], ctx: CommandContext) => Promise<CommandResult> | CommandResult;
}

export function getCommands(): CliCommand[] {
  return [...buildCoreCommands(), ...buildCollectionsCommands()];
}

export function resolveCommand(name: string, commands: CliCommand[]): CliCommand | null {
  const lower = name.toLowerCase();
  return commands.find((cmd) => cmd.name === lower || cmd.aliases.includes(lower)) ?? null;
}
