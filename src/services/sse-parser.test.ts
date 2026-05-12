import { describe, expect, test } from 'bun:test';
import { createSSEParser } from './sse-parser';
import type { SSEEvent } from '../types';

describe('sse-parser', () => {
  test('parses multi-line data frame', () => {
    const events: SSEEvent[] = [];
    const parser = createSSEParser({
      onEvent: (event) => {
        events.push(event);
      },
      onRetry: () => {},
    });

    parser.push('data: line1\ndata: line2\n\n');

    expect(events).toHaveLength(1);
    expect(events[0]?.data).toBe('line1\nline2');
  });
});
