import { describe, expect, test } from 'bun:test';
import type { Collection } from '../../../core/types';
import { listVirtualPath, renderVirtualPath, resolveVirtualPath } from './virtualFs';

const collections: Collection[] = [
  {
    id: 'col-1',
    name: 'Users',
    requests: [
      {
        id: 'req-1',
        name: 'Get Users',
        protocol: 'rest',
        method: 'GET',
        url: 'https://example.com/users',
        headers: {},
        body: { mode: 'none' },
      },
    ],
  },
];

describe('virtualFs', () => {
  test('resolves collection and request paths', () => {
    const collectionRoot = resolveVirtualPath({ kind: 'root' }, 'collection', collections).path;
    expect(collectionRoot).toEqual({ kind: 'collectionRoot' });

    const collection = resolveVirtualPath(collectionRoot!, 'Users', collections).path;
    expect(collection).toEqual({ kind: 'collection', collectionId: 'col-1' });

    const request = resolveVirtualPath(collection!, 'Get Users', collections).path;
    expect(request).toEqual({ kind: 'request', collectionId: 'col-1', requestId: 'req-1' });
    expect(renderVirtualPath(request!, collections)).toBe('mailman/collection/Users/Get Users');
  });

  test('navigates to parent paths', () => {
    const path = resolveVirtualPath(
      { kind: 'request', collectionId: 'col-1', requestId: 'req-1' },
      '../',
      collections,
    ).path;
    expect(path).toEqual({ kind: 'collection', collectionId: 'col-1' });
  });

  test('lists collection requests', () => {
    const output = listVirtualPath({ kind: 'collection', collectionId: 'col-1' }, collections);
    expect(output).toContain('Get Users');
    expect(output).toContain('GET https://example.com/users');
  });
});
