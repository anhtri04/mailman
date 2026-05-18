import { formatXml } from './response-formatter';

export interface FormatResult {
  value: string;
  changed: boolean;
  error?: string;
}

function unchanged(value: string, error?: string): FormatResult {
  return { value, changed: false, error };
}

function changed(original: string, value: string): FormatResult {
  return { value, changed: value !== original };
}

function isJsonContentType(contentType: string): boolean {
  const normalized = contentType.toLowerCase();
  return normalized.includes('json') || normalized.includes('+json');
}

function isXmlContentType(contentType: string): boolean {
  const normalized = contentType.toLowerCase();
  return normalized.includes('xml') || normalized.includes('html');
}

export function formatRequestBody(body: string, contentType: string): FormatResult {
  if (!body.trim()) return unchanged(body);

  if (isJsonContentType(contentType)) {
    try {
      const parsed: unknown = JSON.parse(body);
      return changed(body, JSON.stringify(parsed, null, 2));
    } catch {
      return unchanged(body, 'Invalid JSON');
    }
  }

  if (isXmlContentType(contentType)) {
    const formatted = formatXml(body);
    return changed(body, formatted);
  }

  const trimmed = body.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed: unknown = JSON.parse(body);
      return changed(body, JSON.stringify(parsed, null, 2));
    } catch {
      return unchanged(body, 'Invalid JSON');
    }
  }

  if (trimmed.startsWith('<')) {
    return changed(body, formatXml(body));
  }

  return unchanged(body, 'Nothing to format');
}

export function formatGraphQLVariables(variables: string): FormatResult {
  if (!variables.trim()) return unchanged(variables);

  try {
    const parsed: unknown = JSON.parse(variables);
    return changed(variables, JSON.stringify(parsed, null, 2));
  } catch {
    return unchanged(variables, 'Invalid JSON');
  }
}

function appendIndent(output: string, indent: number): string {
  return output + '  '.repeat(Math.max(0, indent));
}

function trimTrailingHorizontalWhitespace(value: string): string {
  return value.replace(/[ \t]+$/u, '');
}

function validateGraphQLQuery(query: string): string | undefined {
  const stack: string[] = [];
  let inString = false;
  let inBlockString = false;
  let escaped = false;

  for (let i = 0; i < query.length; i++) {
    const char = query[i];
    if (char === undefined) continue;

    if (inBlockString) {
      if (query.slice(i, i + 3) === '"""') {
        inBlockString = false;
        i += 2;
      }
      continue;
    }

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (query.slice(i, i + 3) === '"""') {
      inBlockString = true;
      i += 2;
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === '#') {
      while (i < query.length && query[i] !== '\n') i++;
      continue;
    }

    if (char === '{' || char === '(' || char === '[') {
      stack.push(char);
      continue;
    }

    if (char === '}' || char === ')' || char === ']') {
      const open = stack.pop();
      if (
        (char === '}' && open !== '{') ||
        (char === ')' && open !== '(') ||
        (char === ']' && open !== '[')
      ) {
        return 'Invalid GraphQL query';
      }
    }
  }

  if (inString || inBlockString || stack.length > 0) return 'Invalid GraphQL query';
  return undefined;
}

export function formatGraphQLQuery(query: string): FormatResult {
  if (!query.trim()) return unchanged(query);

  const validationError = validateGraphQLQuery(query);
  if (validationError) return unchanged(query, validationError);

  let output = '';
  let indent = 0;
  let pendingSpace = false;
  let atLineStart = true;

  const ensureSpace = () => {
    if (!atLineStart && output && !/[\s([{]/u.test(output.at(-1) ?? '')) {
      output += ' ';
    }
  };

  const newline = () => {
    output = trimTrailingHorizontalWhitespace(output);
    if (!output.endsWith('\n')) output += '\n';
    output = appendIndent(output, indent);
    atLineStart = true;
    pendingSpace = false;
  };

  for (let i = 0; i < query.length; i++) {
    const char = query[i];
    if (char === undefined) continue;

    if (/\s/u.test(char)) {
      pendingSpace = true;
      continue;
    }

    if (char === '#') {
      if (!atLineStart) newline();
      let comment = '#';
      i++;
      while (i < query.length && query[i] !== '\n') {
        comment += query[i] ?? '';
        i++;
      }
      output += comment.trimEnd();
      newline();
      continue;
    }

    if (query.slice(i, i + 3) === '"""') {
      if (pendingSpace) ensureSpace();
      let blockString = '"""';
      i += 3;
      while (i < query.length && query.slice(i, i + 3) !== '"""') {
        blockString += query[i] ?? '';
        i++;
      }
      if (i < query.length) {
        blockString += '"""';
        i += 2;
      }
      output += blockString;
      atLineStart = false;
      pendingSpace = false;
      continue;
    }

    if (char === '"') {
      if (pendingSpace) ensureSpace();
      let stringValue = '"';
      i++;
      let escaped = false;
      while (i < query.length) {
        const stringChar = query[i];
        if (stringChar === undefined) break;
        stringValue += stringChar;
        if (escaped) {
          escaped = false;
        } else if (stringChar === '\\') {
          escaped = true;
        } else if (stringChar === '"') {
          break;
        }
        i++;
      }
      output += stringValue;
      atLineStart = false;
      pendingSpace = false;
      continue;
    }

    if (char === '{') {
      if (pendingSpace) ensureSpace();
      output = trimTrailingHorizontalWhitespace(output);
      if (output && !output.endsWith(' ') && !output.endsWith('(') && !output.endsWith('[')) {
        output += ' ';
      }
      output += '{';
      indent++;
      newline();
      continue;
    }

    if (char === '}') {
      indent = Math.max(0, indent - 1);
      if (!atLineStart) newline();
      output = trimTrailingHorizontalWhitespace(output);
      output = appendIndent(output, indent);
      output += '}';
      atLineStart = false;
      pendingSpace = false;
      continue;
    }

    if (char === '(' || char === '[') {
      if (pendingSpace) ensureSpace();
      output += char;
      atLineStart = false;
      pendingSpace = false;
      continue;
    }

    if (char === ')' || char === ']') {
      output = trimTrailingHorizontalWhitespace(output);
      output += char;
      atLineStart = false;
      pendingSpace = false;
      continue;
    }

    if (char === ':') {
      output = trimTrailingHorizontalWhitespace(output);
      output += ': ';
      atLineStart = false;
      pendingSpace = false;
      continue;
    }

    if (char === ',') {
      output = trimTrailingHorizontalWhitespace(output);
      output += ', ';
      atLineStart = false;
      pendingSpace = false;
      continue;
    }

    if (pendingSpace) ensureSpace();
    if ((output.at(-1) === '}' || output.at(-1) === ',') && /[A-Za-z_]/u.test(char)) {
      newline();
    }
    output += char;
    atLineStart = false;
    pendingSpace = false;
  }

  const formatted = output.trimEnd();
  return changed(query, formatted);
}
