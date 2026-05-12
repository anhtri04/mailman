import type { SSEEvent } from '../types';

export interface SSEParseCallbacks {
  onEvent: (event: SSEEvent) => void;
  onRetry: (ms: number) => void;
  onComment?: (comment: string) => void;
}

export interface SSEParser {
  push(chunk: string): void;
  flush(): void;
}

interface SSEEventDraft {
  id?: string;
  event?: string;
  dataLines: string[];
  retry?: number;
  rawLines: string[];
}

export function createSSEParser(callbacks: SSEParseCallbacks): SSEParser {
  let buffer = '';

  const parseFrame = (frame: string): void => {
    const normalized = frame.replace(/\r/g, '');
    if (!normalized.trim()) return;

    const lines = normalized.split('\n');
    const draft: SSEEventDraft = {
      dataLines: [],
      rawLines: [],
    };

    for (const line of lines) {
      draft.rawLines.push(line);

      if (line.startsWith(':')) {
        callbacks.onComment?.(line.slice(1).trim());
        continue;
      }

      const separatorIndex = line.indexOf(':');
      const field = separatorIndex >= 0 ? line.slice(0, separatorIndex) : line;
      const rawValue = separatorIndex >= 0 ? line.slice(separatorIndex + 1) : '';
      const value = rawValue.startsWith(' ') ? rawValue.slice(1) : rawValue;

      if (field === 'data') {
        draft.dataLines.push(value);
        continue;
      }

      if (field === 'event') {
        draft.event = value;
        continue;
      }

      if (field === 'id') {
        draft.id = value;
        continue;
      }

      if (field === 'retry') {
        const parsed = Number.parseInt(value, 10);
        if (!Number.isNaN(parsed) && parsed >= 0) {
          draft.retry = parsed;
          callbacks.onRetry(parsed);
        }
      }
    }

    if (draft.dataLines.length === 0) {
      return;
    }

    callbacks.onEvent({
      id: draft.id,
      event: draft.event,
      data: draft.dataLines.join('\n'),
      retry: draft.retry,
      timestamp: Date.now(),
      raw: draft.rawLines.join('\n'),
    });
  };

  const processBuffer = (): void => {
    const normalized = buffer.replace(/\r\n/g, '\n');
    let start = 0;

    for (let i = 0; i < normalized.length - 1; i++) {
      if (normalized[i] === '\n' && normalized[i + 1] === '\n') {
        const frame = normalized.slice(start, i);
        parseFrame(frame);
        start = i + 2;
      }
    }

    buffer = normalized.slice(start);
  };

  return {
    push(chunk: string) {
      if (!chunk) return;
      buffer += chunk;
      processBuffer();
    },
    flush() {
      if (!buffer.trim()) {
        buffer = '';
        return;
      }
      parseFrame(buffer);
      buffer = '';
    },
  };
}
