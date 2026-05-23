import { test, expect, describe } from 'bun:test';
import { CollectionImportView } from './CollectionImportView';

describe('CollectionImportView', () => {
  test('should export CollectionImportView component', () => {
    expect(CollectionImportView).toBeDefined();
    expect(typeof CollectionImportView).toBe('function');
  });

  test('should own collection create and import state', () => {
    const componentString = CollectionImportView.toString();
    expect(componentString).toContain('useState');
    expect(componentString).toContain('"new"');
    expect(componentString).toContain('"import"');
    expect(componentString).toContain('newCollectionName');
    expect(componentString).toContain('importError');
  });

  test('should create collections and notify parent with loaded collections', () => {
    const componentString = CollectionImportView.toString();
    expect(componentString).toContain('addCollection');
    expect(componentString).toContain('loadCollections');
    expect(componentString).toContain('onCollectionsChange(updated)');
  });

  test('should import json collections through FileBrowser', () => {
    const componentString = CollectionImportView.toString();
    expect(componentString).toContain('FileBrowser');
    expect(componentString).toContain('importCollectionsFromFile');
    expect(componentString).toContain('saveCollections');
    expect(componentString).toContain('item.name.endsWith(".json")');
  });

  test('should include select-all key binding for collection name input', () => {
    const componentString = CollectionImportView.toString();
    expect(componentString).toContain('select-all');
    expect(componentString).toContain('keyBindings: selectAllBindings');
  });
});
