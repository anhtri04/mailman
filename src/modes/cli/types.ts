import type { Collection, RequestOptions, ResponseState } from '../../core/types';

export type CliOutputKind = 'system' | 'request' | 'response' | 'error';
export type CliResponseProtocol = 'rest' | 'graphql' | 'sse';

interface CliTextOutputEntry {
  id: string;
  kind: Exclude<CliOutputKind, 'response'>;
  content: string;
  timestamp: number;
}

interface CliResponseOutputEntry {
  id: string;
  kind: 'response';
  response: ResponseState;
  request: {
    protocol: CliResponseProtocol;
    method: string;
    url: string;
  };
  timestamp: number;
}

export type CliOutputEntry = CliTextOutputEntry | CliResponseOutputEntry;

export interface CliViewToggles {
  showBody: boolean;
  showHeaders: boolean;
  showMeta: boolean;
}

export type CliVirtualPath =
  | { kind: 'root' }
  | { kind: 'collectionRoot' }
  | { kind: 'collection'; collectionId: string }
  | { kind: 'request'; collectionId: string; requestId: string };

export interface CliSessionState {
  input: string;
  outputs: CliOutputEntry[];
  history: string[];
  historyIndex: number | null;
  activeCollectionId: string | null;
  activeRequest: RequestOptions;
  collections: Collection[];
  virtualPath: CliVirtualPath;
  lastResponse: ResponseState | null;
  toggles: CliViewToggles;
  isLoading: boolean;
}

export interface ParsedCommand {
  kind: 'command';
  raw: string;
  name: string;
  args: string[];
}

export interface ParsedRequest {
  kind: 'request';
  raw: string;
  request: RequestOptions;
  protocol?: 'rest' | 'graphql' | 'sse';
  responseMode?: 'standard' | 'sse';
}

export interface ParsedShellCommand {
  kind: 'shell';
  raw: string;
  name: string;
  args: string[];
}

export type ParsedInput = ParsedCommand | ParsedRequest | ParsedShellCommand;
