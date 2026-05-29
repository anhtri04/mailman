import { loadCollections } from '../../../../core/services';
import type { RequestItem } from '../../../../core/types';
import type { CliEditorPanel, CliVirtualPath } from '../../types';
import { requestAtPath, requestItemToRequestOptions } from '../../shell/virtualFs';
import type { CliCommand, CommandContext } from '../registry';

type RequestPath = Extract<CliVirtualPath, { kind: 'request' }>;

interface CurrentRequestResult {
  path: RequestPath;
  request: RequestItem;
}

interface EditorCommandDefinition {
  name: string;
  aliases: string[];
  panel: CliEditorPanel;
  description: string;
  protocols?: RequestItem['protocol'][];
}

async function ensureCurrentRequest(ctx: CommandContext): Promise<CurrentRequestResult | string> {
  const path = ctx.state.virtualPath;

  if (path.kind !== 'request') {
    return [
      'Editor commands are only available inside a request path.',
      'Example:',
      '  cd collection/<collection>/<request>',
      '  /header',
    ].join('\n');
  }

  const collections = ctx.state.collections.length
    ? ctx.state.collections
    : await loadCollections();
  const request = requestAtPath(path, collections);

  if (!request) {
    return 'Current request path no longer exists. Run ls/tree and cd into a valid request.';
  }

  ctx.setState((prev) => {
    const draft =
      prev.activeCollectionId === path.collectionId && prev.activeRequestItem?.id === request.id
        ? prev.activeRequestItem
        : structuredClone(request);
    const options = requestItemToRequestOptions(draft);

    return {
      ...prev,
      collections,
      activeCollectionId: path.collectionId,
      activeRequest: typeof options === 'string' ? prev.activeRequest : options,
      activeRequestItem: draft,
    };
  });

  return { path, request };
}

const EDITOR_COMMANDS: EditorCommandDefinition[] = [
  {
    name: 'header',
    aliases: ['headers'],
    panel: 'headers',
    description: 'Open headers editor',
  },
  {
    name: 'body',
    aliases: [],
    panel: 'body',
    description: 'Open REST body editor',
    protocols: ['rest'],
  },
  {
    name: 'params',
    aliases: ['param'],
    panel: 'params',
    description: 'Open query params editor',
    protocols: ['rest'],
  },
  {
    name: 'query',
    aliases: [],
    panel: 'query',
    description: 'Open GraphQL query editor',
    protocols: ['graphql'],
  },
  {
    name: 'variable',
    aliases: ['variables', 'vars'],
    panel: 'variable',
    description: 'Open GraphQL variables editor',
    protocols: ['graphql'],
  },
  {
    name: 'auth',
    aliases: [],
    panel: 'auth',
    description: 'Open auth editor',
    protocols: ['rest', 'graphql'],
  },
  {
    name: 'scripts',
    aliases: ['script'],
    panel: 'scripts',
    description: 'Open scripts editor',
    protocols: ['rest', 'graphql'],
  },
];

export function buildEditorCommands(): CliCommand[] {
  return [
    ...EDITOR_COMMANDS.map(
      (entry): CliCommand => ({
        name: entry.name,
        aliases: entry.aliases,
        description: entry.description,
        usage: `/${entry.name}`,
        handler: async (_args, ctx) => {
          const current = await ensureCurrentRequest(ctx);
          if (typeof current === 'string') return { error: current };

          if (entry.protocols && !entry.protocols.includes(current.request.protocol)) {
            return {
              error: `/${entry.name} is only available for ${entry.protocols.join(' or ')} requests.`,
            };
          }

          ctx.openEditor(entry.panel);
          return { message: `${entry.description}.` };
        },
      }),
    ),
    {
      name: 'save',
      aliases: ['w'],
      description: 'Save edited request back to the current request path',
      usage: '/save',
      handler: async (_args, ctx) => ctx.saveActiveRequest(),
    },
  ];
}
