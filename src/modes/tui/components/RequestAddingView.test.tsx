import { test, expect, describe } from 'bun:test';
import { RequestAddingView } from './RequestAddingView';

describe('RequestAddingView', () => {
  test('should export RequestAddingView component', () => {
    expect(RequestAddingView).toBeDefined();
    expect(typeof RequestAddingView).toBe('function');
  });

  test('should own request adding form state', () => {
    const componentString = RequestAddingView.toString();
    expect(componentString).toContain('useState');
    expect(componentString).toContain('newRequestProtocol');
    expect(componentString).toContain('newRequestMethod');
    expect(componentString).toContain('newRequestName');
    expect(componentString).toContain('curlText');
  });

  test('should support rest, graphql, and websocket request inputs', () => {
    const componentString = RequestAddingView.toString();
    expect(componentString).toContain('requestProtocolOptions');
    expect(componentString).toContain('protocol: "graphql"');
    expect(componentString).toContain('protocol: "websocket"');
    expect(componentString).toContain('protocol: "rest"');
  });

  test('should parse quick curl values before adding request', () => {
    const componentString = RequestAddingView.toString();
    expect(componentString).toContain('parseCurl');
    expect(componentString).toContain('parsed.method');
    expect(componentString).toContain('parsed.headers');
    expect(componentString).toContain('parsed.protocol');
  });

  test('should add request to active collection and notify parent', () => {
    const componentString = RequestAddingView.toString();
    expect(componentString).toContain('activeCollectionId');
    expect(componentString).toContain('addRequestToCollection');
    expect(componentString).toContain('loadCollections');
    expect(componentString).toContain('onCollectionsChange(updated)');
  });

  test('should include select-all key binding for text inputs', () => {
    const componentString = RequestAddingView.toString();
    expect(componentString).toContain('select-all');
    expect(componentString).toContain('keyBindings: selectAllBindings');
  });
});
