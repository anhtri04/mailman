import type { CliCommand, CommandResult } from '../registry';
import type { CliSessionState } from '../../types';

function updateToggle(
  field: 'body' | 'headers' | 'meta',
  value: boolean,
  setState: (updater: (prev: CliSessionState) => CliSessionState) => void,
): CommandResult {
  setState((prev) => ({
    ...prev,
    toggles: {
      ...prev.toggles,
      showBody: field === 'body' ? value : prev.toggles.showBody,
      showHeaders: field === 'headers' ? value : prev.toggles.showHeaders,
      showMeta: field === 'meta' ? value : prev.toggles.showMeta,
    },
  }));
  return { message: `${value ? 'Show' : 'Hide'} ${field} enabled.` };
}

export function buildCoreCommands(): CliCommand[] {
  return [
    {
      name: 'help',
      aliases: ['h'],
      description: 'Show available commands',
      usage: '/help [command]',
      argsSpec: [{ name: 'command', required: false, dynamicValues: 'commands' }],
      handler: (_args, _ctx) => ({
        message:
          'Commands: /help, /theme, /history, /settings, /collections, /use <id|name>, /show <body|headers|meta>, /hide <body|headers|meta>, /clear, /exit',
      }),
    },
    {
      name: 'show',
      aliases: [],
      description: 'Show response section',
      usage: '/show body|headers|meta',
      argsSpec: [{ name: 'section', required: true, values: ['body', 'headers', 'meta'] }],
      handler: (args, ctx) => {
        const target = args[0] as 'body' | 'headers' | 'meta' | undefined;
        if (!target || !['body', 'headers', 'meta'].includes(target)) {
          return { error: 'Usage: /show body|headers|meta' };
        }
        return updateToggle(target, true, ctx.setState);
      },
    },
    {
      name: 'hide',
      aliases: [],
      description: 'Hide response section',
      usage: '/hide body|headers|meta',
      argsSpec: [{ name: 'section', required: true, values: ['body', 'headers', 'meta'] }],
      handler: (args, ctx) => {
        const target = args[0] as 'body' | 'headers' | 'meta' | undefined;
        if (!target || !['body', 'headers', 'meta'].includes(target)) {
          return { error: 'Usage: /hide body|headers|meta' };
        }
        return updateToggle(target, false, ctx.setState);
      },
    },
    {
      name: 'theme',
      aliases: ['themes'],
      description: 'Open theme selector',
      usage: '/theme',
      handler: (_args, ctx) => {
        ctx.openThemeSelector();
        return { message: 'Opening theme selector.' };
      },
    },
    {
      name: 'history',
      aliases: ['hist'],
      description: 'Open request history',
      usage: '/history',
      handler: async (_args, ctx) => {
        await ctx.openHistory();
        return { message: 'Opening request history.' };
      },
    },
    {
      name: 'clear',
      aliases: ['cls'],
      description: 'Clear output panel',
      usage: '/clear',
      handler: (_args, ctx) => {
        ctx.setState((prev) => ({ ...prev, outputs: [] }));
        return { message: 'Output cleared.' };
      },
    },
    {
      name: 'exit',
      aliases: ['quit', 'q'],
      description: 'Exit mailman CLI mode',
      usage: '/exit',
      handler: (_args, ctx) => {
        ctx.cleanExit();
        return {};
      },
    },
    {
      name: 'settings',
      aliases: [],
      description: 'Open settings panel',
      usage: '/settings',
      handler: (_args, ctx) => {
        ctx.openSettings();
        return { message: 'Opening settings panel.' };
      },
    },
  ];
}
