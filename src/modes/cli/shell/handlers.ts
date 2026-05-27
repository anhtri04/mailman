import { loadCollections } from '../../../core/services';
import type { RequestOptions } from '../../../core/types';
import type { CliResponseProtocol, CliSessionState, ParsedShellCommand } from '../types';
import type { CommandResult } from '../commands/registry';
import {
  formatRequest,
  formatTree,
  listVirtualPath,
  renderVirtualPath,
  requestAtPath,
  requestItemToRequestOptions,
  resolveVirtualPath,
} from './virtualFs';

interface ShellContext {
  state: CliSessionState;
  setState: (updater: (prev: CliSessionState) => CliSessionState) => void;
}

export interface ShellCommandResult extends CommandResult {
  request?: RequestOptions;
  protocol?: CliResponseProtocol;
  collectionId?: string;
  requestId?: string;
  requestName?: string;
}

function shellHelp(): string {
  return [
    'Shell commands:',
    '  pwd                 Show current Mailman path',
    '  ls [path]           List collections or requests',
    '  cd <path>           Change Mailman path',
    '  tree [path]         Show collection/request hierarchy',
    '  cat [path]          Show request details',
    '  run|send [path]     Send selected request',
    '  open|select <path>  Select a request',
    '  clear               Clear output panel',
    '  help                Show this help',
  ].join('\n');
}

async function getCollections(ctx: ShellContext) {
  const collections = ctx.state.collections.length
    ? ctx.state.collections
    : await loadCollections();
  if (!ctx.state.collections.length) {
    ctx.setState((prev) => ({ ...prev, collections }));
  }
  return collections;
}

export async function handleShellCommand(
  parsed: ParsedShellCommand,
  ctx: ShellContext,
): Promise<ShellCommandResult> {
  const collections = await getCollections(ctx);
  const argPath = parsed.args.join(' ').trim();

  switch (parsed.name) {
    case 'help':
      return { message: shellHelp() };
    case 'clear':
      ctx.setState((prev) => ({ ...prev, outputs: [] }));
      return { message: 'Output cleared.' };
    case 'pwd':
      return { message: renderVirtualPath(ctx.state.virtualPath, collections) };
    case 'cd': {
      if (!argPath) return { error: 'Usage: cd <path>' };
      const resolved = resolveVirtualPath(ctx.state.virtualPath, argPath, collections);
      if (resolved.error || !resolved.path) return { error: resolved.error ?? 'Path not found.' };
      ctx.setState((prev) => ({ ...prev, virtualPath: resolved.path!, collections }));
      return { message: renderVirtualPath(resolved.path, collections) };
    }
    case 'ls': {
      const target = argPath
        ? resolveVirtualPath(ctx.state.virtualPath, argPath, collections)
        : { path: ctx.state.virtualPath };
      if (target.error || !target.path) return { error: target.error ?? 'Path not found.' };
      return { message: listVirtualPath(target.path, collections) };
    }
    case 'tree': {
      const target = argPath
        ? resolveVirtualPath(ctx.state.virtualPath, argPath, collections)
        : { path: ctx.state.virtualPath };
      if (target.error || !target.path) return { error: target.error ?? 'Path not found.' };
      return { message: formatTree(target.path, collections) };
    }
    case 'cat': {
      const target = argPath
        ? resolveVirtualPath(ctx.state.virtualPath, argPath, collections)
        : { path: ctx.state.virtualPath };
      if (target.error || !target.path) return { error: target.error ?? 'Path not found.' };
      const request = requestAtPath(target.path, collections);
      if (!request) return { error: 'cat expects a request path.' };
      return { message: formatRequest(request) };
    }
    case 'open':
    case 'select': {
      if (!argPath) return { error: `Usage: ${parsed.name} <request-path>` };
      const target = resolveVirtualPath(ctx.state.virtualPath, argPath, collections);
      if (target.error || !target.path) return { error: target.error ?? 'Path not found.' };
      const request = requestAtPath(target.path, collections);
      if (!request) return { error: `${parsed.name} expects a request path.` };
      const options = requestItemToRequestOptions(request);
      if (typeof options === 'string') return { error: options };
      ctx.setState((prev) => ({
        ...prev,
        virtualPath: target.path!,
        activeCollectionId:
          target.path!.kind === 'request' ? target.path!.collectionId : prev.activeCollectionId,
        activeRequest: options,
        collections,
      }));
      return { message: `Selected request: ${request.name}` };
    }
    case 'run':
    case 'send': {
      const target = argPath
        ? resolveVirtualPath(ctx.state.virtualPath, argPath, collections)
        : { path: ctx.state.virtualPath };
      if (target.error || !target.path) return { error: target.error ?? 'Path not found.' };
      const request = requestAtPath(target.path, collections);
      if (!request)
        return { error: `${parsed.name} expects the current path or argument to be a request.` };
      const options = requestItemToRequestOptions(request);
      if (typeof options === 'string') return { error: options };
      ctx.setState((prev) => ({
        ...prev,
        virtualPath: target.path!,
        activeCollectionId:
          target.path!.kind === 'request' ? target.path!.collectionId : prev.activeCollectionId,
        activeRequest: options,
        collections,
      }));
      return {
        request: options,
        protocol: request.protocol === 'graphql' ? 'graphql' : 'rest',
        collectionId: target.path.kind === 'request' ? target.path.collectionId : undefined,
        requestId: target.path.kind === 'request' ? target.path.requestId : undefined,
        requestName: request.name,
      };
    }
    default:
      return { error: `Unknown shell command: ${parsed.name}. Try help.` };
  }
}
