import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { homedir } from 'os';
import { join } from 'path';
import { existsSync } from 'fs';
import {
  loadCollections,
  saveCollections,
  addCollection,
  addRequestToCollection,
  deleteCollection,
  deleteRequest,
  updateRequest,
  updateCollectionName,
} from './collection';
import type { Collection } from '../types';

const MAILMAN_DIR = join(homedir(), '.mailman');
const COLLECTIONS_FILE = join(MAILMAN_DIR, 'collections.json');

describe('collection persistence', () => {
  let originalCollections: Collection[] | null = null;

  beforeEach(async () => {
    // Save original state
    if (existsSync(COLLECTIONS_FILE)) {
      const fs = await import('fs/promises');
      const data = await fs.readFile(COLLECTIONS_FILE, 'utf-8').catch(() => null);
      if (data) {
        originalCollections = JSON.parse(data);
      }
    }
    // Clear for testing
    const fs = await import('fs/promises');
    await fs.writeFile(COLLECTIONS_FILE, JSON.stringify([]), 'utf-8').catch(() => {});
  });

  afterEach(async () => {
    // Restore original state
    if (originalCollections) {
      const fs = await import('fs/promises');
      await fs.writeFile(COLLECTIONS_FILE, JSON.stringify(originalCollections, null, 2), 'utf-8');
    }
  });

  test('loadCollections returns empty array when file does not exist', async () => {
    const fs = await import('fs/promises');
    await fs.unlink(COLLECTIONS_FILE).catch(() => {});
    const result = await loadCollections();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  test('save and load roundtrip', async () => {
    const collections: Collection[] = [
      { id: '1', name: 'Test Collection', requests: [], protocol: 'rest' },
    ];
    await saveCollections(collections);
    const loaded = await loadCollections();
    expect(loaded).toEqual(collections);
  });

  test('loadCollections ignores malformed JSON', async () => {
    const fs = await import('fs/promises');
    await fs.writeFile(COLLECTIONS_FILE, 'not valid json', 'utf-8');
    const result = await loadCollections();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  test('addCollection creates new collection', async () => {
    const collection = await addCollection('New Collection');
    expect(collection.name).toBe('New Collection');
    expect(collection.requests).toEqual([]);
    expect(collection.id).toBeDefined();

    const loaded = await loadCollections();
    expect(loaded.length).toBe(1);
    expect(loaded[0]?.name).toBe('New Collection');
  });

  test('addRequestToCollection adds request to existing collection', async () => {
    const collection = await addCollection('API Collection');
    const request = await addRequestToCollection(collection.id, {
      name: 'Get Users',
      method: 'GET',
      url: 'https://api.example.com/users',
      headers: { Authorization: 'Bearer token' },
    });

    expect(request.name).toBe('Get Users');
    expect(request.method).toBe('GET');
    expect(request.id).toBeDefined();

    const loaded = await loadCollections();
    expect(loaded[0]?.requests.length).toBe(1);
    expect(loaded[0]?.requests[0]?.name).toBe('Get Users');
  });

  test('deleteCollection removes collection', async () => {
    const collection = await addCollection('To Delete');
    const loaded = await loadCollections();
    expect(loaded.length).toBe(1);

    await deleteCollection(collection.id);
    const afterDelete = await loadCollections();
    expect(afterDelete.length).toBe(0);
  });

  test('deleteRequest removes request from collection', async () => {
    const collection = await addCollection('API Collection');
    const request = await addRequestToCollection(collection.id, {
      name: 'Get Users',
      method: 'GET',
      url: 'https://api.example.com/users',
    });

    await deleteRequest(collection.id, request.id);
    const loaded = await loadCollections();
    expect(loaded[0]?.requests.length).toBe(0);
  });

  test('updateCollectionName renames collection', async () => {
    const collection = await addCollection('Old Name');
    await updateCollectionName(collection.id, 'New Name');
    const loaded = await loadCollections();
    expect(loaded[0]?.name).toBe('New Name');
  });

  test('handles multiple collections', async () => {
    await addCollection('Collection 1');
    await addCollection('Collection 2');
    const loaded = await loadCollections();
    expect(loaded.length).toBe(2);
  });

  test('updateRequest updates fields on existing request', async () => {
    const collection = await addCollection('API Collection');
    const request = await addRequestToCollection(collection.id, {
      name: 'Get Users',
      method: 'GET',
      url: 'https://api.example.com/users',
    });

    await updateRequest(collection.id, request.id, {
      method: 'POST',
      url: 'https://api.example.com/users/create',
      headers: { 'Content-Type': 'application/json' },
      body: '{"name":"Jane"}',
    });

    const loaded = await loadCollections();
    const updated = loaded[0]?.requests[0];
    expect(updated?.method).toBe('POST');
    expect(updated?.url).toBe('https://api.example.com/users/create');
    expect(updated?.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(updated?.body).toBe('{"name":"Jane"}');
    expect(updated?.name).toBe('Get Users');
    expect(updated?.id).toBe(request.id);
  });

  test('updateRequest throws for missing collection', async () => {
    try {
      await updateRequest('nonexistent', 'req1', { method: 'POST' });
      expect.unreachable('Should have thrown');
    } catch (error) {
      expect(error instanceof Error && error.message.includes('Collection not found')).toBe(true);
    }
  });

  test('updateRequest throws for missing request', async () => {
    const collection = await addCollection('API Collection');
    try {
      await updateRequest(collection.id, 'nonexistent', { method: 'POST' });
      expect.unreachable('Should have thrown');
    } catch (error) {
      expect(error instanceof Error && error.message.includes('Request not found')).toBe(true);
    }
  });

  test('handles requests with body and auth', async () => {
    const collection = await addCollection('Auth Collection');
    const request = await addRequestToCollection(collection.id, {
      name: 'Create User',
      method: 'POST',
      url: 'https://api.example.com/users',
      headers: { 'Content-Type': 'application/json' },
      body: '{"name":"John"}',
      auth: { type: 'bearer', token: 'secret' },
    });

    expect(request.body).toBe('{"name":"John"}');
    expect(request.auth?.type).toBe('bearer');

    const loaded = await loadCollections();
    expect(loaded[0]?.requests[0]?.body).toBe('{"name":"John"}');
    expect(loaded[0]?.requests[0]?.auth?.token).toBe('secret');
  });
});
