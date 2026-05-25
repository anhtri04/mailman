import { readFile } from 'fs/promises';
import type { AuthConfig, Collection, RequestBody, RequestItem } from '../types';
import { rawRequestBody } from './request-body';

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
      formdata?: Array<{ key: string; value?: string; src?: string; type?: string }>;
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
}): AuthConfig | undefined {
  if (!auth?.type) return undefined;
  if (auth.type === 'bearer') {
    const token = auth.bearer?.find((kv) => kv.key === 'token')?.value ?? '';
    return { type: 'bearer', token };
  }
  if (auth.type === 'apikey') {
    const key = auth.apikey?.find((kv) => kv.key === 'key')?.value ?? '';
    const value = auth.apikey?.find((kv) => kv.key === 'value')?.value ?? '';
    const location =
      auth.apikey?.find((kv) => kv.key === 'in')?.value === 'query' ? 'query' : 'header';
    return { type: 'api-key', key, value, location };
  }
  return undefined;
}

function toRequestItem(input: {
  id: string;
  name: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string | RequestBody;
  variables?: string;
  auth?: AuthConfig;
  isGraphQL: boolean;
}): RequestItem {
  if (input.isGraphQL) {
    return {
      id: input.id,
      name: input.name,
      protocol: 'graphql',
      url: input.url,
      query: typeof input.body === 'string' ? input.body : '',
      variables: input.variables ?? '',
      headers: input.headers,
      auth: input.auth,
    };
  }

  return {
    id: input.id,
    name: input.name,
    protocol: 'rest',
    method: input.method,
    url: input.url,
    headers: input.headers,
    body: typeof input.body === 'string' ? rawRequestBody(input.body) : input.body,
    auth: input.auth,
  };
}

function parsePostman(raw: Record<string, unknown>): Collection[] {
  const info = raw.info as { name?: string } | undefined;
  const name = info?.name || 'Imported Postman';
  const items = flattenPostman((raw.item as PMItem[]) ?? []);

  const requests: RequestItem[] = items.map((item, i) => {
    const rq = item.request;
    const method = (rq.method ?? 'GET').toUpperCase();
    const url = typeof rq.url === 'string' ? rq.url : (rq.url?.raw ?? '');

    const headers: Record<string, string> = {};
    for (const h of rq.header ?? []) {
      if (h.key) headers[h.key] = h.value ?? '';
    }

    let body: string | RequestBody = '';
    let variables = '';
    if (rq.body?.mode === 'raw') {
      body = rq.body.raw ?? '';
    } else if (rq.body?.mode === 'urlencoded') {
      body = {
        mode: 'urlencoded',
        fields: (rq.body.urlencoded ?? []).map((p, index) => ({
          id: `${Date.now()}-urlencoded-${index}`,
          enabled: true,
          key: p.key,
          value: p.value,
        })),
      };
    } else if (rq.body?.mode === 'formdata') {
      body = {
        mode: 'multipart',
        fields: (rq.body.formdata ?? []).map((p, index) => {
          if (p.type === 'file') {
            return {
              id: `${Date.now()}-formdata-${index}`,
              enabled: true,
              kind: 'file' as const,
              name: p.key,
              filePath: p.src ?? '',
            };
          }
          return {
            id: `${Date.now()}-formdata-${index}`,
            enabled: true,
            kind: 'text' as const,
            name: p.key,
            value: p.value ?? '',
          };
        }),
      };
    } else if (rq.body?.mode === 'graphql') {
      body = rq.body.graphql?.query ?? '';
      variables = rq.body.graphql?.variables ?? '';
    }

    const bodyText = typeof body === 'string' ? body : '';
    const isGraphQL =
      rq.body?.mode === 'graphql' || url.includes('/graphql') || /^\s*query\s+\w+/.test(bodyText);

    return toRequestItem({
      id: `${Date.now()}-${i}`,
      name: item.name || 'Untitled',
      method,
      url,
      headers,
      body,
      variables,
      auth: parsePostmanAuth(rq.auth),
      isGraphQL,
    });
  });

  return [{ id: Date.now().toString(), name, requests }];
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
          const isGraphQL =
            r.url?.includes('/graphql') || r.body?.mimeType === 'application/graphql';

          if (isGraphQL) {
            try {
              const parsed = JSON.parse(body);
              body = parsed.query ?? body;
              variables = JSON.stringify(parsed.variables ?? {});
            } catch {
              // leave body as-is
            }
          }

          const auth: AuthConfig | undefined =
            r.authentication?.type === 'bearer'
              ? { type: 'bearer', token: r.authentication.token ?? '' }
              : r.authentication?.type === 'apikey'
                ? {
                    type: 'api-key',
                    key: r.authentication.key ?? '',
                    value: r.authentication.value ?? '',
                    location: r.authentication.addTo === 'query' ? 'query' : 'header',
                  }
                : undefined;

          wsRequests.push(
            toRequestItem({
              id: `${Date.now()}-${wsRequests.length}`,
              name: r.name || 'Untitled',
              method: (r.method ?? 'GET').toUpperCase(),
              url: r.url ?? '',
              headers,
              body,
              variables,
              auth,
              isGraphQL,
            }),
          );
        }
      }
    };

    collect(ws._id);

    if (wsRequests.length) {
      result.push({
        id: Date.now().toString(),
        name: ws.name || 'Imported Insomnia',
        requests: wsRequests,
      });
    }
  }

  return result;
}
