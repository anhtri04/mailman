import { RGBA, SyntaxStyle } from '@opentui/core';
import type { MailmanColors } from '../theme/types';

export type TextareaHighlightLanguage = 'json' | 'graphql' | 'xml' | 'html' | 'text';

export type TextareaHighlightStyle =
  | 'key'
  | 'string'
  | 'number'
  | 'boolean'
  | 'null'
  | 'keyword'
  | 'variable'
  | 'comment'
  | 'punctuation'
  | 'operator'
  | 'tag'
  | 'attribute'
  | 'error';

export interface TextareaHighlightToken {
  start: number;
  end: number;
  style: TextareaHighlightStyle;
}

const GRAPHQL_KEYWORDS = new Set([
  'query',
  'mutation',
  'subscription',
  'fragment',
  'on',
  'schema',
  'type',
  'interface',
  'union',
  'input',
  'enum',
  'scalar',
  'extend',
  'directive',
  'true',
  'false',
  'null',
]);

function toRgba(color: string): RGBA {
  return RGBA.fromHex(color);
}

export function createTextareaSyntaxStyle(colors: MailmanColors): SyntaxStyle {
  return SyntaxStyle.fromStyles({
    key: { fg: toRgba(colors.accent.primary) },
    string: { fg: toRgba(colors.syntax.success) },
    number: { fg: toRgba(colors.syntax.warning) },
    boolean: { fg: toRgba(colors.syntax.info) },
    null: { fg: toRgba(colors.text.muted) },
    keyword: { fg: toRgba(colors.accent.text) },
    variable: { fg: toRgba(colors.syntax.info) },
    comment: { fg: toRgba(colors.text.dim) },
    punctuation: { fg: toRgba(colors.syntax.punctuation) },
    operator: { fg: toRgba(colors.syntax.punctuation) },
    tag: { fg: toRgba(colors.accent.primary) },
    attribute: { fg: toRgba(colors.syntax.warning) },
    error: { fg: toRgba(colors.syntax.error) },
  });
}

function findStringEnd(text: string, start: number): number {
  let i = start + 1;
  let escaped = false;

  while (i < text.length) {
    const char = text[i];
    if (char === undefined) break;

    if (escaped) {
      escaped = false;
    } else if (char === '\\') {
      escaped = true;
    } else if (char === '"') {
      return i + 1;
    }
    i++;
  }

  return text.length;
}

function isJsonKey(text: string, end: number): boolean {
  let i = end;
  while (i < text.length && /\s/u.test(text[i] ?? '')) i++;
  return text[i] === ':';
}

export function tokenizeJsonWithRanges(text: string): TextareaHighlightToken[] {
  const tokens: TextareaHighlightToken[] = [];
  let i = 0;

  while (i < text.length) {
    const char = text[i];
    if (char === undefined) break;

    if (/\s/u.test(char)) {
      i++;
      continue;
    }

    if (char === '"') {
      const end = findStringEnd(text, i);
      tokens.push({ start: i, end, style: isJsonKey(text, end) ? 'key' : 'string' });
      i = end;
      continue;
    }

    if (/[{}[\],:]/u.test(char)) {
      tokens.push({ start: i, end: i + 1, style: 'punctuation' });
      i++;
      continue;
    }

    if (/-?\d/u.test(char)) {
      const match = text.slice(i).match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/u);
      if (match?.[0]) {
        tokens.push({ start: i, end: i + match[0].length, style: 'number' });
        i += match[0].length;
        continue;
      }
    }

    if (text.slice(i).startsWith('true') || text.slice(i).startsWith('false')) {
      const value = text.slice(i).startsWith('true') ? 'true' : 'false';
      tokens.push({ start: i, end: i + value.length, style: 'boolean' });
      i += value.length;
      continue;
    }

    if (text.slice(i).startsWith('null')) {
      tokens.push({ start: i, end: i + 4, style: 'null' });
      i += 4;
      continue;
    }

    i++;
  }

  return tokens;
}

function findBlockStringEnd(text: string, start: number): number {
  const closeIndex = text.indexOf('"""', start + 3);
  return closeIndex === -1 ? text.length : closeIndex + 3;
}

function isGraphQLNameStart(char: string): boolean {
  return /[_A-Za-z]/u.test(char);
}

function isGraphQLNameContinue(char: string): boolean {
  return /[_0-9A-Za-z]/u.test(char);
}

export function tokenizeGraphQLWithRanges(text: string): TextareaHighlightToken[] {
  const tokens: TextareaHighlightToken[] = [];
  let i = 0;

  while (i < text.length) {
    const char = text[i];
    if (char === undefined) break;

    if (/\s/u.test(char)) {
      i++;
      continue;
    }

    if (char === '#') {
      const start = i;
      while (i < text.length && text[i] !== '\n') i++;
      tokens.push({ start, end: i, style: 'comment' });
      continue;
    }

    if (text.slice(i, i + 3) === '"""') {
      const end = findBlockStringEnd(text, i);
      tokens.push({ start: i, end, style: 'string' });
      i = end;
      continue;
    }

    if (char === '"') {
      const end = findStringEnd(text, i);
      tokens.push({ start: i, end, style: 'string' });
      i = end;
      continue;
    }

    if (char === '$') {
      const start = i;
      i++;
      while (i < text.length && isGraphQLNameContinue(text[i] ?? '')) i++;
      tokens.push({ start, end: i, style: 'variable' });
      continue;
    }

    if (/[{}()[\]:!,=@|&]/u.test(char)) {
      tokens.push({ start: i, end: i + 1, style: 'punctuation' });
      i++;
      continue;
    }

    if (char === '.' && text.slice(i, i + 3) === '...') {
      tokens.push({ start: i, end: i + 3, style: 'operator' });
      i += 3;
      continue;
    }

    if (/-?\d/u.test(char)) {
      const match = text.slice(i).match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/u);
      if (match?.[0]) {
        tokens.push({ start: i, end: i + match[0].length, style: 'number' });
        i += match[0].length;
        continue;
      }
    }

    if (isGraphQLNameStart(char)) {
      const start = i;
      i++;
      while (i < text.length && isGraphQLNameContinue(text[i] ?? '')) i++;
      const value = text.slice(start, i);
      if (GRAPHQL_KEYWORDS.has(value)) {
        const style: TextareaHighlightStyle =
          value === 'true' || value === 'false' ? 'boolean' : value === 'null' ? 'null' : 'keyword';
        tokens.push({ start, end: i, style });
      }
      continue;
    }

    i++;
  }

  return tokens;
}

export function tokenizeForTextareaHighlighting(
  text: string,
  language: TextareaHighlightLanguage,
): TextareaHighlightToken[] {
  switch (language) {
    case 'json':
      return tokenizeJsonWithRanges(text);
    case 'graphql':
      return tokenizeGraphQLWithRanges(text);
    case 'xml':
    case 'html':
    case 'text':
      return [];
  }
}
