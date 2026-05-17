import type { Collection } from '../../../core/types';
import type { CliCommand } from '../commands/registry';
import { lexInput, type InputToken } from './lexer';

export type InputSuggestionKind =
  | 'keyword'
  | 'protocol'
  | 'method'
  | 'url'
  | 'flag'
  | 'value'
  | 'command';

export interface InputSuggestion {
  id: string;
  label: string;
  detail?: string;
  kind: InputSuggestionKind;
  replacementStart: number;
  replacementEnd: number;
  insertText: string;
  appendSpace?: boolean;
  executeOnEnter?: boolean;
}

export interface InputAnalysisContext {
  commands: CliCommand[];
  collections: Collection[];
}

export interface InputAnalysis {
  raw: string;
  mode: 'empty' | 'command' | 'request' | 'unknown';
  valid: boolean;
  complete: boolean;
  canSubmit: boolean;
  tokens: InputToken[];
  suggestions: InputSuggestion[];
  errors: string[];
}

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
const PROTOCOLS = [
  { label: 'rest', detail: 'REST/JSON HTTP request' },
  { label: 'graphql', detail: 'GraphQL HTTP request' },
  { label: 'gql', detail: 'Alias for graphql' },
  { label: 'sse', detail: 'Server-Sent Events stream' },
];

const REST_OPTIONS = [
  { label: '--header', detail: 'Add header' },
  { label: '-H', detail: 'Add header' },
  { label: '--query', detail: 'Add query parameter' },
  { label: '-q', detail: 'Add query parameter' },
  { label: '--json', detail: 'Set JSON body' },
  { label: '--body', detail: 'Set raw body' },
  { label: '--data', detail: 'Set raw body' },
  { label: '-d', detail: 'Set raw body' },
  { label: '--auth', detail: 'Set auth' },
  { label: '--timeout', detail: 'Set timeout' },
  { label: '--stream', detail: 'Set stream mode' },
];

const GRAPHQL_OPTIONS = [
  { label: '--query', detail: 'GraphQL query' },
  { label: '--variables', detail: 'GraphQL variables JSON' },
  { label: '--operation', detail: 'GraphQL operation name' },
  { label: '--header', detail: 'Add header' },
  { label: '-H', detail: 'Add header' },
  { label: '--auth', detail: 'Set auth' },
  { label: '--timeout', detail: 'Set timeout' },
];

const SSE_OPTIONS = [
  { label: '--query', detail: 'Add query parameter' },
  { label: '-q', detail: 'Add query parameter' },
  { label: '--header', detail: 'Add header' },
  { label: '-H', detail: 'Add header' },
  { label: '--auth', detail: 'Set auth' },
  { label: '--timeout', detail: 'Set timeout' },
];

function activeToken(tokens: InputToken[], trailingWhitespace: boolean): InputToken | null {
  if (trailingWhitespace) return null;
  return tokens[tokens.length - 1] ?? null;
}

function replacementRange(
  raw: string,
  token: InputToken | null,
): { start: number; end: number; query: string } {
  if (!token) return { start: raw.length, end: raw.length, query: '' };
  return { start: token.start, end: token.end, query: token.value };
}

function buildSuggestions(
  raw: string,
  token: InputToken | null,
  values: Array<{
    label: string;
    detail?: string;
    kind?: InputSuggestionKind;
    executeOnEnter?: boolean;
  }>,
  defaultKind: InputSuggestionKind,
): InputSuggestion[] {
  const { start, end, query } = replacementRange(raw, token);
  const lowerQuery = query.toLowerCase();
  return values
    .filter((value) => value.label.toLowerCase().startsWith(lowerQuery))
    .slice(0, 8)
    .map((value) => ({
      id: `${defaultKind}:${value.label}`,
      label: value.label,
      detail: value.detail,
      kind: value.kind ?? defaultKind,
      replacementStart: start,
      replacementEnd: end,
      insertText: value.label,
      appendSpace: true,
      executeOnEnter: value.executeOnEnter,
    }));
}

function optionValueSuggestions(
  raw: string,
  token: InputToken | null,
  option: string,
): InputSuggestion[] {
  const valuesByOption: Record<string, Array<{ label: string; detail?: string }>> = {
    '--header': [
      { label: '"Accept: application/json"' },
      { label: '"Content-Type: application/json"' },
    ],
    '-H': [{ label: '"Accept: application/json"' }, { label: '"Content-Type: application/json"' }],
    '--query': [{ label: 'key=value' }],
    '-q': [{ label: 'key=value' }],
    '--json': [{ label: '\'{"key":"value"}\'' }],
    '--body': [{ label: "'body'" }],
    '--data': [{ label: "'body'" }],
    '-d': [{ label: "'body'" }],
    '--variables': [{ label: '\'{"key":"value"}\'' }],
    '--operation': [{ label: 'OperationName' }],
    '--auth': [
      { label: 'bearer:TOKEN' },
      { label: 'basic:user:pass' },
      { label: 'apikey:X-API-Key=TOKEN' },
    ],
    '--timeout': [{ label: '30000' }],
    '--stream': [{ label: 'auto' }, { label: 'sse' }, { label: 'off' }],
  };

  return buildSuggestions(raw, token, valuesByOption[option] ?? [], 'value');
}

function commandSuggestions(raw: string, context: InputAnalysisContext): InputAnalysis {
  const lexed = lexInput(raw);
  const { tokens, trailingWhitespace } = lexed;
  const first = tokens[0];
  const commandTokenValue = first?.value.slice(1) ?? '';

  if (tokens.length <= 1 && !trailingWhitespace) {
    const token = first ?? null;
    const values = context.commands.map((command) => ({
      label: `/${command.name}`,
      detail: command.description,
      executeOnEnter: !command.usage.trim().includes(' '),
    }));
    return {
      raw,
      mode: 'command',
      valid: true,
      complete: false,
      canSubmit: false,
      tokens,
      suggestions: buildSuggestions(raw, token, values, 'command'),
      errors: [],
    };
  }

  const commandName = commandTokenValue.toLowerCase();
  const command = context.commands.find(
    (candidate) => candidate.name === commandName || candidate.aliases.includes(commandName),
  );

  if (!command) {
    return {
      raw,
      mode: 'command',
      valid: false,
      complete: false,
      canSubmit: false,
      tokens,
      suggestions: [],
      errors: [`Unknown command: /${commandName}`],
    };
  }

  const argIndex = Math.max(0, tokens.length - 2 - (trailingWhitespace ? -1 : 0));
  const spec = command.argsSpec?.[argIndex];
  if (!spec) {
    return {
      raw,
      mode: 'command',
      valid: true,
      complete: true,
      canSubmit: true,
      tokens,
      suggestions: [],
      errors: [],
    };
  }

  const token = activeToken(tokens, trailingWhitespace);
  let values = spec.values?.map((label) => ({ label })) ?? [];
  if (spec.dynamicValues === 'collections') {
    values = context.collections.flatMap((collection) => [
      { label: collection.name, detail: collection.id },
      { label: collection.id, detail: collection.name },
    ]);
  } else if (spec.dynamicValues === 'commands') {
    values = context.commands.map((candidate) => ({
      label: candidate.name,
      detail: candidate.description,
    }));
  }

  return {
    raw,
    mode: 'command',
    valid: true,
    complete: false,
    canSubmit: false,
    tokens,
    suggestions: buildSuggestions(raw, token, values, 'value'),
    errors: [],
  };
}

function urlSuggestions(raw: string, token: InputToken | null): InputSuggestion[] {
  return buildSuggestions(
    raw,
    token,
    [{ label: 'https://example.com' }, { label: 'http://localhost:3000' }, { label: '/' }],
    'url',
  );
}

function analyzeRequest(raw: string): InputAnalysis {
  const lexed = lexInput(raw);
  const { tokens, trailingWhitespace } = lexed;
  const token = activeToken(tokens, trailingWhitespace);

  if (tokens.length === 0) {
    return {
      raw,
      mode: 'request',
      valid: true,
      complete: false,
      canSubmit: false,
      tokens,
      suggestions: buildSuggestions(
        raw,
        token,
        [{ label: 'http', detail: 'Start an HTTP request' }],
        'keyword',
      ),
      errors: [],
    };
  }

  if (tokens.length === 1 && !trailingWhitespace && tokens[0]?.value !== 'http') {
    return {
      raw,
      mode: 'unknown',
      valid: false,
      complete: false,
      canSubmit: false,
      tokens,
      suggestions: buildSuggestions(
        raw,
        token,
        [{ label: 'http', detail: 'Start an HTTP request' }],
        'keyword',
      ),
      errors: ['Request input must start with http'],
    };
  }

  if (tokens[0]?.value !== 'http') {
    return {
      raw,
      mode: 'unknown',
      valid: false,
      complete: false,
      canSubmit: false,
      tokens,
      suggestions: buildSuggestions(
        raw,
        token,
        [{ label: 'http', detail: 'Start an HTTP request' }],
        'keyword',
      ),
      errors: ['Request input must start with http'],
    };
  }

  if (tokens.length === 1 || (tokens.length === 2 && !trailingWhitespace)) {
    return {
      raw,
      mode: 'request',
      valid: true,
      complete: false,
      canSubmit: false,
      tokens,
      suggestions: buildSuggestions(raw, token, PROTOCOLS, 'protocol'),
      errors: [],
    };
  }

  const protocol = tokens[1]?.value.toLowerCase();
  if (!protocol || !['rest', 'graphql', 'gql', 'sse'].includes(protocol)) {
    return {
      raw,
      mode: 'request',
      valid: false,
      complete: false,
      canSubmit: false,
      tokens,
      suggestions: buildSuggestions(raw, token, PROTOCOLS, 'protocol'),
      errors: ['Unknown HTTP protocol'],
    };
  }

  if (protocol === 'rest') {
    if (tokens.length === 2 || (tokens.length === 3 && !trailingWhitespace)) {
      const values = HTTP_METHODS.map((label) => ({ label }));
      return {
        raw,
        mode: 'request',
        valid: true,
        complete: false,
        canSubmit: false,
        tokens,
        suggestions: buildSuggestions(raw, token, values, 'method'),
        errors: [],
      };
    }

    if (tokens.length === 3 || (tokens.length === 4 && !trailingWhitespace)) {
      return {
        raw,
        mode: 'request',
        valid: true,
        complete: false,
        canSubmit: false,
        tokens,
        suggestions: urlSuggestions(raw, token),
        errors: [],
      };
    }

    const previous = trailingWhitespace ? tokens[tokens.length - 1] : tokens[tokens.length - 2];
    if (previous?.kind === 'flag' && optionRequiresValue(previous.value)) {
      return {
        raw,
        mode: 'request',
        valid: true,
        complete: false,
        canSubmit: false,
        tokens,
        suggestions: optionValueSuggestions(raw, token, previous.value),
        errors: [],
      };
    }

    return {
      raw,
      mode: 'request',
      valid: true,
      complete: true,
      canSubmit: true,
      tokens,
      suggestions: buildSuggestions(raw, token, REST_OPTIONS, 'flag'),
      errors: [],
    };
  }

  if (tokens.length === 2 || (tokens.length === 3 && !trailingWhitespace)) {
    return {
      raw,
      mode: 'request',
      valid: true,
      complete: false,
      canSubmit: false,
      tokens,
      suggestions: urlSuggestions(raw, token),
      errors: [],
    };
  }

  const previous = trailingWhitespace ? tokens[tokens.length - 1] : tokens[tokens.length - 2];
  if (previous?.kind === 'flag' && optionRequiresValue(previous.value)) {
    return {
      raw,
      mode: 'request',
      valid: true,
      complete: false,
      canSubmit: false,
      tokens,
      suggestions: optionValueSuggestions(raw, token, previous.value),
      errors: [],
    };
  }

  const options = protocol === 'sse' ? SSE_OPTIONS : GRAPHQL_OPTIONS;
  return {
    raw,
    mode: 'request',
    valid: true,
    complete: true,
    canSubmit: true,
    tokens,
    suggestions: buildSuggestions(raw, token, options, 'flag'),
    errors: [],
  };
}

function optionRequiresValue(option: string): boolean {
  return !['--follow', '--insecure', '-k'].includes(option);
}

export function analyzeUnifiedInput(raw: string, context: InputAnalysisContext): InputAnalysis {
  if (!raw.trim()) {
    return {
      raw,
      mode: 'empty',
      valid: true,
      complete: false,
      canSubmit: false,
      tokens: [],
      suggestions: [
        {
          id: 'keyword:http',
          label: 'http',
          detail: 'Start an HTTP request',
          kind: 'keyword',
          replacementStart: 0,
          replacementEnd: raw.length,
          insertText: 'http',
          appendSpace: true,
        },
        ...context.commands.slice(0, 4).map((command) => ({
          id: `command:${command.name}`,
          label: `/${command.name}`,
          detail: command.description,
          kind: 'command' as const,
          replacementStart: 0,
          replacementEnd: raw.length,
          insertText: `/${command.name}`,
          appendSpace: command.usage.trim().includes(' '),
          executeOnEnter: !command.usage.trim().includes(' '),
        })),
      ],
      errors: [],
    };
  }

  if (raw.startsWith('/')) return commandSuggestions(raw, context);
  return analyzeRequest(raw);
}
