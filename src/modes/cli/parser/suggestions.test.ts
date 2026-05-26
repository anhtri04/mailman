import { describe, expect, test } from 'bun:test';
import type { CliCommand } from '../commands/registry';
import { analyzeUnifiedInput } from './suggestions';

const commands: CliCommand[] = [
  {
    name: 'show',
    aliases: [],
    description: 'Show response section',
    usage: '/show body|headers|meta',
    argsSpec: [{ name: 'section', required: true, values: ['body', 'headers', 'meta'] }],
    handler: () => ({}),
  },
  {
    name: 'clear',
    aliases: [],
    description: 'Clear output',
    usage: '/clear',
    handler: () => ({}),
  },
];

const context = { commands, collections: [], virtualPath: { kind: 'root' } as const };

describe('analyzeUnifiedInput', () => {
  test('suggests request protocols after http', () => {
    const analysis = analyzeUnifiedInput('http ', context);
    expect(analysis.suggestions.map((suggestion) => suggestion.label)).toContain('rest');
    expect(analysis.suggestions.map((suggestion) => suggestion.label)).toContain('graphql');
    expect(analysis.suggestions.map((suggestion) => suggestion.label)).toContain('sse');
  });

  test('suggests REST methods', () => {
    const analysis = analyzeUnifiedInput('http rest P', context);
    expect(analysis.suggestions.map((suggestion) => suggestion.label)).toEqual([
      'POST',
      'PUT',
      'PATCH',
    ]);
  });

  test('marks complete REST request as submittable while showing optional flags', () => {
    const analysis = analyzeUnifiedInput('http rest GET https://example.com ', context);
    expect(analysis.canSubmit).toBe(true);
    expect(analysis.suggestions.map((suggestion) => suggestion.label)).toContain('--header');
  });

  test('suggests command argument values', () => {
    const analysis = analyzeUnifiedInput('/show h', context);
    expect(analysis.suggestions.map((suggestion) => suggestion.label)).toEqual(['headers']);
  });
});
