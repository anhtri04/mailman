import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtemp, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { importCollectionsFromFile } from './import';

let tempDir: string;

async function writeTemp(name: string, data: unknown): Promise<string> {
  const path = join(tempDir, name);
  await writeFile(path, JSON.stringify(data), 'utf-8');
  return path;
}

describe('importCollectionsFromFile', () => {
  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'mailman-import-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  test('throws on unrecognized format', async () => {
    const path = await writeTemp('unknown.json', { foo: 'bar' });
    expect(importCollectionsFromFile(path)).rejects.toThrow('Unrecognized collection format');
  });

  describe('Postman v2.1', () => {
    test('basic request with headers and bearer auth', async () => {
      const path = await writeTemp('postman.json', {
        info: { name: 'Test API', schema: 'https://schema.getpostman.com/json/collection/v2.1.0/' },
        item: [
          {
            name: 'Get Users',
            request: {
              method: 'GET',
              url: { raw: 'https://api.example.com/users' },
              header: [{ key: 'X-Custom', value: 'val' }],
              auth: {
                type: 'bearer',
                bearer: [{ key: 'token', value: 'tok123' }],
              },
            },
          },
        ],
      });

      const result = await importCollectionsFromFile(path);
      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe('Test API');
      expect(result[0]?.requests).toHaveLength(1);
      const req = result[0]?.requests[0];
      expect(req?.name).toBe('Get Users');
      expect(req?.method).toBe('GET');
      expect(req?.url).toBe('https://api.example.com/users');
      expect(req?.headers).toEqual({ 'X-Custom': 'val' });
      expect(req?.auth).toEqual({ type: 'bearer', token: 'tok123' });
    });

    test('urlencoded body is converted', async () => {
      const path = await writeTemp('postman-form.json', {
        info: { name: 'Forms', schema: 'postman' },
        item: [
          {
            name: 'Submit',
            request: {
              method: 'POST',
              url: 'https://api.example.com/submit',
              body: {
                mode: 'urlencoded',
                urlencoded: [
                  { key: 'name', value: 'Alice' },
                  { key: 'age', value: '30' },
                ],
              },
            },
          },
        ],
      });

      const result = await importCollectionsFromFile(path);
      const req = result[0]?.requests[0];
      expect(req?.body).toEqual({
        mode: 'urlencoded',
        fields: expect.arrayContaining([
          expect.objectContaining({ enabled: true, key: 'name', value: 'Alice' }),
          expect.objectContaining({ enabled: true, key: 'age', value: '30' }),
        ]),
      });
    });

    test('raw body and unsupported auth are handled', async () => {
      const path = await writeTemp('postman-raw.json', {
        info: { name: 'Raw', schema: 'postman' },
        item: [
          {
            name: 'Create',
            request: {
              method: 'POST',
              url: 'https://api.example.com/create',
              body: { mode: 'raw', raw: '{"name":"Bob"}' },
              auth: { type: 'basic', basic: [{ key: 'username', value: 'admin' }] },
            },
          },
        ],
      });

      const result = await importCollectionsFromFile(path);
      const req = result[0]?.requests[0];
      expect(req?.body).toEqual({ mode: 'raw', content: '{"name":"Bob"}' });
      expect(req?.auth).toBeUndefined();
    });

    test('nested folders are flattened', async () => {
      const path = await writeTemp('postman-nested.json', {
        info: { name: 'Nested', schema: 'postman' },
        item: [
          {
            name: 'Folder A',
            item: [
              {
                name: 'Subfolder',
                item: [
                  {
                    name: 'Deep Request',
                    request: { method: 'DELETE', url: 'https://api.example.com/del' },
                  },
                ],
              },
            ],
          },
          {
            name: 'Top Request',
            request: { method: 'GET', url: 'https://api.example.com/top' },
          },
        ],
      });

      const result = await importCollectionsFromFile(path);
      expect(result[0]?.requests).toHaveLength(2);
      expect(result[0]?.requests.map((r) => r.name)).toContain('Deep Request');
      expect(result[0]?.requests.map((r) => r.name)).toContain('Top Request');
    });

    test('graphql detection with mode and variables', async () => {
      const path = await writeTemp('postman-gql.json', {
        info: { name: 'GQL', schema: 'postman' },
        item: [
          {
            name: 'GetUser',
            request: {
              method: 'POST',
              url: 'https://api.example.com/graphql',
              body: {
                mode: 'graphql',
                graphql: {
                  query: 'query GetUser($id: ID!) { user(id: $id) { name } }',
                  variables: JSON.stringify({ id: '1' }),
                },
              },
            },
          },
        ],
      });

      const result = await importCollectionsFromFile(path);
      const req = result[0]?.requests[0];
      expect(req?.protocol).toBe('graphql');
      expect(req?.query).toBe('query GetUser($id: ID!) { user(id: $id) { name } }');
      expect(req?.variables).toBe(JSON.stringify({ id: '1' }));
    });

    test('pure rest collections stay rest', async () => {
      const path = await writeTemp('postman-rest.json', {
        info: { name: 'REST Only', schema: 'postman' },
        item: [
          {
            name: 'Get Users',
            request: { method: 'GET', url: 'https://api.example.com/users' },
          },
          {
            name: 'Create User',
            request: {
              method: 'POST',
              url: 'https://api.example.com/users',
              body: { mode: 'raw', raw: '{"name":"Alice"}' },
            },
          },
        ],
      });

      const result = await importCollectionsFromFile(path);
      expect(result[0]?.requests[0]?.protocol).toBe('rest');
      expect(result[0]?.requests).toHaveLength(2);
    });

    test('all-graphql collection sets protocol to graphql', async () => {
      const path = await writeTemp('postman-gql-all.json', {
        info: { name: 'GQL Only', schema: 'postman' },
        item: [
          {
            name: 'GetUser',
            request: {
              method: 'POST',
              url: 'https://api.example.com/graphql',
              body: {
                mode: 'graphql',
                graphql: { query: 'query GetUser { user { id } }', variables: '' },
              },
            },
          },
          {
            name: 'GetPosts',
            request: {
              method: 'POST',
              url: 'https://api.example.com/graphql',
              body: {
                mode: 'graphql',
                graphql: { query: 'query GetPosts { posts { title } }', variables: '' },
              },
            },
          },
        ],
      });

      const result = await importCollectionsFromFile(path);
      expect(result[0]?.requests.every((request) => request.protocol === 'graphql')).toBe(true);
      expect(result[0]?.requests).toHaveLength(2);
    });
  });

  describe('Insomnia v4', () => {
    test('basic request with apikey auth', async () => {
      const path = await writeTemp('insomnia.json', {
        __export_format: 4,
        resources: [
          { _type: 'workspace', _id: 'ws_1', name: 'My Workspace', parentId: '__REQ_GROUP_1__' },
          {
            _type: 'request',
            _id: 'req_1',
            name: 'List Items',
            url: 'https://api.example.com/items',
            method: 'GET',
            headers: [{ name: 'Accept', value: 'application/json' }],
            authentication: { type: 'apikey', key: 'X-Key', value: 'secret', addTo: 'header' },
            parentId: 'ws_1',
          },
        ],
      });

      const result = await importCollectionsFromFile(path);
      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe('My Workspace');
      const req = result[0]?.requests[0];
      expect(req?.name).toBe('List Items');
      expect(req?.auth).toEqual({
        type: 'api-key',
        key: 'X-Key',
        value: 'secret',
        location: 'header',
      });
      expect(req?.headers).toEqual({ Accept: 'application/json' });
    });

    test('graphql extraction of query and variables', async () => {
      const path = await writeTemp('insomnia-gql.json', {
        __export_format: 4,
        resources: [
          { _type: 'workspace', _id: 'ws_1', name: 'GQL', parentId: '__REQ_GROUP_1__' },
          {
            _type: 'request',
            _id: 'req_1',
            name: 'GetUser',
            url: 'https://api.example.com/graphql',
            method: 'POST',
            body: {
              mimeType: 'application/json',
              text: JSON.stringify({
                query: 'query GetUser { user { id } }',
                variables: { id: '1' },
              }),
            },
            parentId: 'ws_1',
          },
        ],
      });

      const result = await importCollectionsFromFile(path);
      const req = result[0]?.requests[0];
      expect(req?.query).toBe('query GetUser { user { id } }');
      expect(req?.variables).toBe(JSON.stringify({ id: '1' }));
    });

    test('empty workspace yields no collection', async () => {
      const path = await writeTemp('insomnia-empty.json', {
        __export_format: 4,
        resources: [
          { _type: 'workspace', _id: 'ws_1', name: 'Empty', parentId: '__REQ_GROUP_1__' },
        ],
      });

      const result = await importCollectionsFromFile(path);
      expect(result).toHaveLength(0);
    });
  });
});
