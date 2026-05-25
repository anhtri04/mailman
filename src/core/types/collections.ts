import type { AuthConfig } from './auth';
import type { RequestBody } from './request';
import type { RequestScripts } from './scripts';

export type Protocol = 'rest' | 'graphql' | 'websocket';

export interface Collection {
  id: string;
  name: string;
  requests: RequestItem[];
}

interface BaseRequestItem {
  id: string;
  name: string;
  protocol: Protocol;
  url: string;
  headers: Record<string, string>;
  method?: string;
  body?: RequestBody;
  variables?: string;
  auth?: AuthConfig;
  scripts?: RequestScripts;
}

export interface RestRequestItem extends BaseRequestItem {
  protocol: 'rest';
  method: string;
  body: RequestBody;
}

export interface GraphQLRequestItem extends BaseRequestItem {
  protocol: 'graphql';
  query: string;
  variables: string;
  method?: 'POST';
}

export interface WebSocketRequestItem extends BaseRequestItem {
  protocol: 'websocket';
  initialMessage: string;
}

export type RequestItem = RestRequestItem | GraphQLRequestItem | WebSocketRequestItem;

export type RequestItemInput =
  | Omit<RestRequestItem, 'id'>
  | Omit<GraphQLRequestItem, 'id'>
  | Omit<WebSocketRequestItem, 'id'>;

export type RequestItemUpdate = Partial<RequestItemInput>;
