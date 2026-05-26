import { rawRequestBody } from '../../../core/services';
import type { Collection, RequestItem, RequestOptions } from '../../../core/types';
import type { CliVirtualPath } from '../types';

export function renderVirtualPath(path: CliVirtualPath, collections: Collection[]): string {
  if (path.kind === 'root') return 'mailman';
  if (path.kind === 'collectionRoot') return 'mailman/collection';

  const collection = collections.find((item) => item.id === path.collectionId);
  const collectionName = collection?.name ?? path.collectionId;
  if (path.kind === 'collection') return `mailman/collection/${collectionName}`;

  const request = collection?.requests.find((item) => item.id === path.requestId);
  const requestName = request?.name ?? path.requestId;
  return `mailman/collection/${collectionName}/${requestName}`;
}

export function parentPath(path: CliVirtualPath): CliVirtualPath {
  if (path.kind === 'request') return { kind: 'collection', collectionId: path.collectionId };
  if (path.kind === 'collection') return { kind: 'collectionRoot' };
  return { kind: 'root' };
}

interface ResolveResult {
  path?: CliVirtualPath;
  error?: string;
}

function splitPath(input: string): string[] {
  return input
    .split('/')
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
}

function findCollection(collections: Collection[], segment: string): Collection | string | null {
  const byId = collections.find((collection) => collection.id === segment);
  if (byId) return byId;

  const lower = segment.toLowerCase();
  const matches = collections.filter((collection) => collection.name.toLowerCase() === lower);
  if (matches.length === 1) return matches[0] ?? null;
  if (matches.length > 1) return `Ambiguous collection name: ${segment}. Use the collection id.`;
  return null;
}

function findRequest(collection: Collection, segment: string): RequestItem | string | null {
  const byId = collection.requests.find((request) => request.id === segment);
  if (byId) return byId;

  const lower = segment.toLowerCase();
  const matches = collection.requests.filter((request) => request.name.toLowerCase() === lower);
  if (matches.length === 1) return matches[0] ?? null;
  if (matches.length > 1) return `Ambiguous request name: ${segment}. Use the request id.`;
  return null;
}

function collectionForPath(path: CliVirtualPath, collections: Collection[]): Collection | null {
  if (path.kind !== 'collection' && path.kind !== 'request') return null;
  return collections.find((collection) => collection.id === path.collectionId) ?? null;
}

export function resolveVirtualPath(
  current: CliVirtualPath,
  input: string,
  collections: Collection[],
): ResolveResult {
  const trimmed = input.trim();
  if (!trimmed) return { path: current };

  const absolute =
    trimmed === 'mailman' || trimmed.startsWith('mailman/') || trimmed.startsWith('/');
  const normalized = trimmed.replace(/^\/+/, '').replace(/^mailman\/?/, '');
  const segments = splitPath(normalized);
  let path: CliVirtualPath = absolute ? { kind: 'root' } : current;

  if (trimmed === 'mailman' || trimmed === '/') return { path: { kind: 'root' } };

  for (const segment of segments) {
    if (segment === '.') continue;
    if (segment === '..') {
      path = parentPath(path);
      continue;
    }

    if (path.kind === 'root') {
      if (segment.toLowerCase() === 'collection' || segment.toLowerCase() === 'collections') {
        path = { kind: 'collectionRoot' };
        continue;
      }
      return { error: `Path not found: ${segment}` };
    }

    if (path.kind === 'collectionRoot') {
      const match = findCollection(collections, segment);
      if (typeof match === 'string') return { error: match };
      if (!match) return { error: `Collection not found: ${segment}` };
      path = { kind: 'collection', collectionId: match.id };
      continue;
    }

    if (path.kind === 'collection') {
      const collection = collectionForPath(path, collections);
      if (!collection) return { error: `Collection not found: ${path.collectionId}` };
      const match = findRequest(collection, segment);
      if (typeof match === 'string') return { error: match };
      if (!match) return { error: `Request not found: ${segment}` };
      path = { kind: 'request', collectionId: collection.id, requestId: match.id };
      continue;
    }

    return { error: `Cannot navigate below request: ${segment}` };
  }

  return { path };
}

export function listVirtualPath(path: CliVirtualPath, collections: Collection[]): string {
  if (path.kind === 'root') return 'collection/';
  if (path.kind === 'collectionRoot') {
    if (collections.length === 0) return 'No collections found.';
    return collections
      .map(
        (collection) =>
          `${collection.name}/  ${collection.id}  (${collection.requests.length} requests)`,
      )
      .join('\n');
  }

  const collection = collectionForPath(path, collections);
  if (!collection) return `Collection not found: ${path.collectionId}`;

  if (path.kind === 'collection') {
    if (collection.requests.length === 0) return 'No requests found.';
    return collection.requests
      .map((request) => {
        const method =
          request.protocol === 'rest' ? request.method : request.protocol.toUpperCase();
        return `${request.name}  ${request.id}  ${method} ${request.url}`;
      })
      .join('\n');
  }

  const request = collection.requests.find((item) => item.id === path.requestId);
  if (!request) return `Request not found: ${path.requestId}`;
  return formatRequest(request);
}

export function formatTree(path: CliVirtualPath, collections: Collection[]): string {
  if (path.kind === 'request') return listVirtualPath(path, collections);

  const visibleCollections =
    path.kind === 'collection'
      ? collections.filter((collection) => collection.id === path.collectionId)
      : collections;

  if (path.kind === 'root') {
    return ['mailman', '└── collection', ...formatCollections(visibleCollections, '    ')].join(
      '\n',
    );
  }

  if (path.kind === 'collectionRoot') {
    return ['collection', ...formatCollections(visibleCollections, '')].join('\n');
  }

  const collection = visibleCollections[0];
  if (!collection) return `Collection not found: ${path.collectionId}`;
  return [collection.name, ...formatRequests(collection, '')].join('\n');
}

function formatCollections(collections: Collection[], prefix: string): string[] {
  if (collections.length === 0) return [`${prefix}└── (empty)`];
  return collections.flatMap((collection, index) => {
    const connector = index === collections.length - 1 ? '└──' : '├──';
    const childPrefix = `${prefix}${index === collections.length - 1 ? '    ' : '│   '}`;
    return [`${prefix}${connector} ${collection.name}`, ...formatRequests(collection, childPrefix)];
  });
}

function formatRequests(collection: Collection, prefix: string): string[] {
  if (collection.requests.length === 0) return [`${prefix}└── (no requests)`];
  return collection.requests.map((request, index) => {
    const connector = index === collection.requests.length - 1 ? '└──' : '├──';
    return `${prefix}${connector} ${request.name}`;
  });
}

export function formatRequest(request: RequestItem): string {
  const method = request.protocol === 'rest' ? request.method : request.protocol.toUpperCase();
  const lines = [
    `Name: ${request.name}`,
    `Protocol: ${request.protocol}`,
    `Method: ${method}`,
    `URL: ${request.url}`,
  ];

  const headerEntries = Object.entries(request.headers ?? {});
  if (headerEntries.length > 0) {
    lines.push('Headers:');
    lines.push(...headerEntries.map(([key, value]) => `  ${key}: ${value}`));
  }

  if (request.protocol === 'graphql') {
    lines.push('Query:');
    lines.push(request.query);
    if (request.variables) {
      lines.push('Variables:');
      lines.push(request.variables);
    }
  } else if (request.body?.mode === 'raw' && request.body.content) {
    lines.push('Body:');
    lines.push(request.body.content);
  }

  return lines.join('\n');
}

export function requestAtPath(path: CliVirtualPath, collections: Collection[]): RequestItem | null {
  if (path.kind !== 'request') return null;
  const collection = collectionForPath(path, collections);
  return collection?.requests.find((request) => request.id === path.requestId) ?? null;
}

export function requestItemToRequestOptions(request: RequestItem): RequestOptions | string {
  if (request.protocol === 'websocket') {
    return 'WebSocket requests cannot be sent from CLI shell run yet.';
  }

  if (request.protocol === 'graphql') {
    const payload: { query: string; variables?: unknown } = { query: request.query };
    if (request.variables.trim()) {
      try {
        payload.variables = JSON.parse(request.variables);
      } catch {
        payload.variables = request.variables;
      }
    }

    return {
      method: 'POST',
      url: request.url,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...request.headers,
      },
      body: rawRequestBody(JSON.stringify(payload)),
      auth: request.auth,
      scripts: request.scripts,
    };
  }

  return {
    method: request.method,
    url: request.url,
    headers: request.headers,
    body: request.body,
    auth: request.auth,
    scripts: request.scripts,
  };
}
