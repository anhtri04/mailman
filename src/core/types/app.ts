import type { RequestOptions } from './request';
import type { ResponseState } from './response';

export type FocusArea = 'request' | 'response' | 'collections' | null;

export interface AppState {
  focusedArea: FocusArea;
  request: RequestOptions;
  response: ResponseState | null;
  isLoading: boolean;
}
