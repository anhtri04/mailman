import { readFile } from 'fs/promises';
import type { Collection, RequestItem, Protocol } from '../types';

export async function importCollectionsFromFile(path: string): Promise<Collection[]> {
  const data = await readFile(path, 'utf-8');
  const raw = JSON.parse(data);
  if (isPostman(raw)) return parsePostman(raw);
  if (isInsomnia(raw)) return parseInsomnia(raw);
  throw new Error('Unrecognized collection format');
}

function isPostman(v: unknown): v is Record<string, unknown> {
  if (typeof v !== 'object' || v === null) return false;
  const obj = v as Record<string, unknown>;
  const info = obj.info;
  if (typeof info !== 'object' || info === null) return false;
  const infoObj = info as Record<string, unknown>;
  const schema = infoObj.schema;
  return typeof schema === 'string' && schema.includes('postman');
}

function isInsomnia(v: unknown): v is Record<string, unknown> {
  if (typeof v !== 'object' || v === null) return false;
  const obj = v as Record<string, unknown>;
  return obj.__export_format === 4;
}

type PMLeafItem = {
  name: string;
  request: {
    method?: string;
    url?: { raw?: string } | string;
    header?: Array<{ key: string; value: string }>;
    body?: {
      mode?: string;
      raw?: string;
      urlencoded?: Array<{ key: string; value: string }>;
      graphql?: {
        query?: string;
        variables?: string;
      };
    };
    auth?: {
      type?: string;
      bearer?: Array<{ key: string; value: string }>;
      apikey?: Array<{ key: string; value: string }>;
    };
  };
  item?: PMItem[];
};

type PMItem =
  | PMLeafItem
  | {
      name: string;
      request?: undefined;
      item?: PMItem[];
    };

function flattenPostman(nodes: PMItem[]): PMLeafItem[] {
  const out: PMLeafItem[] = [];
  for (const n of nodes) {
    if ('request' in n && n.request) out.push(n as PMLeafItem);
    if ('item' in n && n.item) out.push(...flattenPostman(n.item));
  }
  return out;
}

function parsePostmanAuth(auth?: {
  type?: string;
  bearer?: Array<{ key: string; value: string }>;
  apikey?: Array<{ key: string; value: string }>;
}): RequestItem['auth'] {
  if (!auth?.type) return undefined;
  if (auth.type === 'bearer') {
    const token =
      auth.bearer?.find((kv: { key: string; value: string }) => kv.key === 'token')?.value ?? '';
    return { type: 'bearer', token };
  }
  if (auth.type === 'apikey') {
    const key =
      auth.apikey?.find((kv: { key: string; value: string }) => kv.key === 'key')?.value ?? '';
    const value =
      auth.apikey?.find((kv: { key: string; value: string }) => kv.key === 'value')?.value ?? '';
    const location =
      auth.apikey?.find((kv: { key: string; value: string }) => kv.key === 'in')?.value === 'query'
        ? 'query'
        : 'header';
    return { type: 'api-key', key, value, location: location as 'header' | 'query' };
  }
  return undefined;
}

function parsePostman(raw: Record<string, unknown>): Collection[] {
  const info = raw.info as { name?: string } | undefined;
  const name = info?.name || 'Imported Postman';
  const items = flattenPostman((raw.item as PMItem[]) ?? []);

  const requests: RequestItem[] = items.map((item, i) => {
    const rq = item.request!;
    const method = (rq.method ?? 'GET').toUpperCase();
    const url = typeof rq.url === 'string' ? rq.url : (rq.url?.raw ?? '');

    const headers: Record<string, string> = {};
    for (const h of rq.header ?? []) {
      if (h.key) headers[h.key] = h.value ?? '';
    }

    let body = '';
    let graphqlVariables: string | undefined;
    if (rq.body?.mode === 'raw') {
      body = rq.body.raw ?? '';
    } else if (rq.body?.mode === 'urlencoded') {
      body = (rq.body.urlencoded ?? [])
        .map(
          (p: { key: string; value: string }) =>
            `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`,
        )
        .join('&');
    } else if (rq.body?.mode === 'formdata') {
      body = '# multipart/form-data not supported';
    } else if (rq.body?.mode === 'graphql') {
      body = rq.body.graphql?.query ?? '';
      graphqlVariables = rq.body.graphql?.variables ?? '';
    }

    const proto: Protocol =
      rq.body?.mode === 'graphql' || url.includes('/graphql') || /^\s*query\s+\w+/.test(body)
        ? 'graphql'
        : 'rest';

    return {
      id: `${Date.now()}-${i}`,
      name: item.name || 'Untitled',
      method,
      url,
      headers: Object.keys(headers).length ? headers : undefined,
      body: body || undefined,
      auth: parsePostmanAuth(rq.auth),
      variables: proto === 'graphql' ? (graphqlVariables ?? '') : undefined,
    };
  });

  const protocol: Protocol =
    requests.length > 0 && requests.every((r) => r.variables !== undefined) ? 'graphql' : 'rest';

  return [
    {
      id: Date.now().toString(),
      name,
      protocol,
      requests,
    },
  ];
}

function parseInsomnia(raw: Record<string, unknown>): Collection[] {
  const resources = (raw.resources as any[]) ?? [];
  const byParent = new Map<string, any[]>();

  for (const r of resources) {
    const list = byParent.get(r.parentId) ?? [];
    list.push(r);
    byParent.set(r.parentId, list);
  }

  const workspaces = resources.filter((r) => r._type === 'workspace');
  const result: Collection[] = [];

  for (const ws of workspaces) {
    const wsRequests: RequestItem[] = [];

    const collect = (parentId: string) => {
      for (const r of byParent.get(parentId) ?? []) {
        if (r._type === 'request_group') {
          collect(r._id);
        } else if (r._type === 'request') {
          const headers: Record<string, string> = {};
          for (const h of r.headers ?? []) {
            if (h.name) headers[h.name] = h.value ?? '';
          }

          let body = r.body?.text ?? '';
          let variables = '';
          const proto: Protocol =
            r.url?.includes('/graphql') || r.body?.mimeType === 'application/graphql'
              ? 'graphql'
              : 'rest';

          if (proto === 'graphql') {
            try {
              const parsed = JSON.parse(body);
              body = parsed.query ?? body;
              variables = JSON.stringify(parsed.variables ?? {});
            } catch {
              // leave body as-is
            }
          }

          const auth =
            r.authentication?.type === 'bearer'
              ? { type: 'bearer' as const, token: r.authentication.token ?? '' }
              : r.authentication?.type === 'apikey'
                ? {
                    type: 'api-key' as const,
                    key: r.authentication.key ?? '',
                    value: r.authentication.value ?? '',
                    location:
                      r.authentication.addTo === 'query' ? ('query' as const) : ('header' as const),
                  }
                : undefined;

          wsRequests.push({
            id: `${Date.now()}-${wsRequests.length}`,
            name: r.name || 'Untitled',
            method: (r.method ?? 'GET').toUpperCase(),
            url: r.url ?? '',
            headers: Object.keys(headers).length ? headers : undefined,
            body: body || undefined,
            auth,
            variables: proto === 'graphql' ? variables : undefined,
          });
        }
      }
    };

    collect(ws._id);

    if (wsRequests.length) {
      const protocol: Protocol = wsRequests.every((r) => r.variables !== undefined)
        ? 'graphql'
        : 'rest';

      result.push({
        id: Date.now().toString(),
        name: ws.name || 'Imported Insomnia',
        protocol,
        requests: wsRequests,
      });
    }
  }

  return result;
}
