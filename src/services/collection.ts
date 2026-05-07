import { mkdirSync, existsSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import type { Collection, Protocol, RequestItem } from '../types';

const MAILMAN_DIR = join(homedir(), '.mailman');
const COLLECTIONS_FILE = join(MAILMAN_DIR, 'collections.json');

function ensureDir() {
  if (!existsSync(MAILMAN_DIR)) {
    mkdirSync(MAILMAN_DIR, { recursive: true });
  }
}

export async function loadCollections(): Promise<Collection[]> {
  try {
    ensureDir();
    const data = await readFile(COLLECTIONS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      return parsed as Collection[];
    }
    return [];
  } catch {
    return [];
  }
}

export async function saveCollections(collections: Collection[]): Promise<void> {
  ensureDir();
  await writeFile(COLLECTIONS_FILE, JSON.stringify(collections, null, 2), 'utf-8');
}

export async function addCollection(
  name: string,
  protocol: Protocol = 'rest',
): Promise<Collection> {
  const collections = await loadCollections();
  const newCollection: Collection = {
    id: Date.now().toString(),
    name,
    protocol,
    requests: [],
  };
  collections.push(newCollection);
  await saveCollections(collections);
  return newCollection;
}

export async function addRequestToCollection(
  collectionId: string,
  request: Omit<RequestItem, 'id'>,
): Promise<RequestItem> {
  const collections = await loadCollections();
  const collection = collections.find((c) => c.id === collectionId);
  if (!collection) throw new Error(`Collection not found: ${collectionId}`);
  const newRequest: RequestItem = {
    id: Date.now().toString(),
    ...request,
  };
  collection.requests.push(newRequest);
  await saveCollections(collections);
  return newRequest;
}

export async function deleteCollection(collectionId: string): Promise<void> {
  const collections = await loadCollections();
  const filtered = collections.filter((c) => c.id !== collectionId);
  await saveCollections(filtered);
}

export async function deleteRequest(collectionId: string, requestId: string): Promise<void> {
  const collections = await loadCollections();
  const collection = collections.find((c) => c.id === collectionId);
  if (!collection) throw new Error(`Collection not found: ${collectionId}`);
  collection.requests = collection.requests.filter((r) => r.id !== requestId);
  await saveCollections(collections);
}

export async function updateRequest(
  collectionId: string,
  requestId: string,
  updates: Partial<Omit<RequestItem, 'id'>>,
): Promise<void> {
  const collections = await loadCollections();
  const collection = collections.find((c) => c.id === collectionId);
  if (!collection) throw new Error(`Collection not found: ${collectionId}`);
  const request = collection.requests.find((r) => r.id === requestId);
  if (!request) throw new Error(`Request not found: ${requestId}`);
  Object.assign(request, updates);
  await saveCollections(collections);
}

export async function updateCollectionName(collectionId: string, name: string): Promise<void> {
  const collections = await loadCollections();
  const collection = collections.find((c) => c.id === collectionId);
  if (!collection) throw new Error(`Collection not found: ${collectionId}`);
  collection.name = name;
  await saveCollections(collections);
}
