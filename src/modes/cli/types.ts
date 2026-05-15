import type { Collection, RequestOptions, ResponseState } from '../../types';

export type CliOutputKind = 'system' | 'request' | 'response' | 'error';

export interface CliOutputEntry {
  id: string;
  kind: CliOutputKind;
  content: string;
  timestamp: number;
}

export interface CliViewToggles {
  showBody: boolean;
  showHeaders: boolean;
  showMeta: boolean;
}

export interface CliSessionState {
  input: string;
  outputs: CliOutputEntry[];
  history: string[];
  historyIndex: number | null;
  activeCollectionId: string | null;
  activeRequest: RequestOptions;
  collections: Collection[];
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
}

export type ParsedInput = ParsedCommand | ParsedRequest;
