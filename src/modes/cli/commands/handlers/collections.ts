import { loadCollections } from '../../../../core/services';
import type { CliCommand } from '../registry';

export function buildCollectionsCommands(): CliCommand[] {
  return [
    {
      name: 'collections',
      aliases: ['cols'],
      description: 'List all collections',
      usage: '/collections',
      handler: async (_args, ctx) => {
        const collections = await loadCollections();
        ctx.setState((prev) => ({ ...prev, collections }));
        if (collections.length === 0) {
          return { message: 'No collections found.' };
        }
        const lines = collections.map((c) => `${c.id}  ${c.name} (${c.protocol})`);
        return { message: lines.join('\n') };
      },
    },
    {
      name: 'use',
      aliases: [],
      description: 'Set active collection',
      usage: '/use <id|name>',
      handler: async (args, ctx) => {
        const needle = args.join(' ').trim().toLowerCase();
        if (!needle) {
          return { error: 'Usage: /use <id|name>' };
        }

        const collections = ctx.state.collections.length
          ? ctx.state.collections
          : await loadCollections();

        const match = collections.find(
          (collection) => collection.id === needle || collection.name.toLowerCase() === needle,
        );

        if (!match) {
          return { error: `Collection not found: ${needle}` };
        }

        ctx.setState((prev) => ({
          ...prev,
          collections,
          activeCollectionId: match.id,
        }));

        return { message: `Active collection: ${match.name}` };
      },
    },
  ];
}
