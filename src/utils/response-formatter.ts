// Response formatting utilities for HTTP responses

export type ContentType = 'json' | 'xml' | 'html' | 'text' | 'binary' | 'unknown';

export interface Token {
  type:
    | 'key'
    | 'string'
    | 'number'
    | 'boolean'
    | 'null'
    | 'bracket'
    | 'comma'
    | 'colon'
    | 'whitespace';
  value: string;
}

/**
 * Detect content type from headers and body
 */
export function detectContentType(headers: Record<string, string>, body: string): ContentType {
  const contentType = headers['content-type']?.toLowerCase() ?? '';

  if (contentType.includes('application/json') || contentType.includes('text/json')) {
    return 'json';
  }

  if (contentType.includes('application/xml') || contentType.includes('text/xml')) {
    return 'xml';
  }

  if (contentType.includes('text/html')) {
    return 'html';
  }

  if (contentType.includes('text/plain')) {
    return 'text';
  }

  if (contentType.includes('application/octet-stream') || contentType.includes('image/')) {
    return 'binary';
  }

  // Try to detect from body content
  if (body.trim().startsWith('{') || body.trim().startsWith('[')) {
    try {
      JSON.parse(body);
      return 'json';
    } catch {
      // Not valid JSON
    }
  }

  if (body.trim().startsWith('<')) {
    const trimmed = body.trim().toLowerCase();
    if (trimmed.startsWith('<!doctype html') || trimmed.startsWith('<html')) {
      return 'html';
    }
    return 'xml';
  }

  return 'text';
}

/**
 * Format JSON with proper indentation
 */
export function formatJson(body: string): string {
  try {
    const parsed = JSON.parse(body);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return body;
  }
}

/**
 * Simple XML/HTML formatter with indentation
 * Preserves the structure while adding line breaks and indentation
 */
export function formatXml(body: string): string {
  if (!body.trim()) return body;

  let formatted = '';
  let indent = 0;

  // Split on tag boundaries, keeping the delimiters
  const parts = body.split(/(<[^>]+>)/g).filter(Boolean);

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part === undefined) continue;

    const trimmed = part.trim();
    if (!trimmed) continue;

    // Check if this is a tag
    if (trimmed.startsWith('<')) {
      // Closing tag - decrease indent
      if (trimmed.startsWith('</')) {
        indent = Math.max(0, indent - 1);
      }

      // Add newline before tag (except first)
      if (formatted) {
        formatted += '\n';
      }

      // Add indentation and tag
      formatted += '  '.repeat(indent) + trimmed;

      // Opening tag (not self-closing) - increase indent
      const isSelfClosing = trimmed.endsWith('/>');
      const isClosingTag = trimmed.startsWith('</');
      const isProcessingInstruction = trimmed.startsWith('<?') || trimmed.startsWith('<!');

      if (!isSelfClosing && !isClosingTag && !isProcessingInstruction) {
        indent++;
      }
    } else {
      // Text content - add on same line if previous was opening tag, otherwise new line
      const text = trimmed;
      if (text) {
        if (formatted && !formatted.endsWith('>')) {
          formatted += '\n' + '  '.repeat(indent);
        } else if (formatted) {
          formatted += ' ';
        }
        formatted += text;
      }
    }
  }

  return formatted || body;
}

/**
 * Format response body based on content type
 */
export function formatResponseBody(body: string, contentType: ContentType): string {
  switch (contentType) {
    case 'json':
      return formatJson(body);
    case 'xml':
    case 'html':
      return formatXml(body);
    case 'text':
      return body;
    case 'binary':
      return '[Binary content - cannot display]';
    default:
      return body;
  }
}

/**
 * Parse JSON and return tokens for syntax highlighting
 */
export function parseJsonForHighlighting(body: string): Token[] {
  const tokens: Token[] = [];

  try {
    // Validate JSON first
    JSON.parse(body);

    // Format first to ensure proper structure
    const formatted = formatJson(body);
    let i = 0;

    while (i < formatted.length) {
      const char = formatted[i];
      if (char === undefined) break;

      // Whitespace
      if (/\s/.test(char)) {
        let value = '';
        while (i < formatted.length) {
          const wsChar = formatted[i];
          if (wsChar === undefined || !/\s/.test(wsChar)) break;
          value += wsChar;
          i++;
        }
        tokens.push({ type: 'whitespace', value });
        continue;
      }

      // String
      if (char === '"') {
        let value = '"';
        i++;
        while (i < formatted.length) {
          const strChar = formatted[i];
          if (strChar === undefined) break;
          if (strChar === '"') break;
          if (strChar === '\\' && i + 1 < formatted.length) {
            const nextChar = formatted[i + 1];
            if (nextChar !== undefined) {
              value += strChar + nextChar;
              i += 2;
            } else {
              value += strChar;
              i++;
            }
          } else {
            value += strChar;
            i++;
          }
        }
        if (i < formatted.length) {
          const closingQuote = formatted[i];
          if (closingQuote === '"') {
            value += '"';
            i++;
          }
        }

        // Check if this is a key (followed by colon)
        const nextNonWhitespace = formatted.slice(i).match(/^\s*:/);
        if (nextNonWhitespace) {
          tokens.push({ type: 'key', value });
        } else {
          tokens.push({ type: 'string', value });
        }
        continue;
      }

      // Number
      if (/[-\d.]/.test(char)) {
        let value = '';
        while (i < formatted.length) {
          const numChar = formatted[i];
          if (numChar === undefined || !/[-\d.eE+]/.test(numChar)) break;
          value += numChar;
          i++;
        }
        tokens.push({ type: 'number', value });
        continue;
      }

      // Boolean
      if (formatted.slice(i).startsWith('true') || formatted.slice(i).startsWith('false')) {
        const isTrue = formatted.slice(i).startsWith('true');
        const value = isTrue ? 'true' : 'false';
        i += value.length;
        tokens.push({ type: 'boolean', value });
        continue;
      }

      // Null
      if (formatted.slice(i).startsWith('null')) {
        i += 4;
        tokens.push({ type: 'null', value: 'null' });
        continue;
      }

      // Brackets and braces
      if (/[{}[\]]/.test(char)) {
        tokens.push({ type: 'bracket', value: char });
        i++;
        continue;
      }

      // Comma
      if (char === ',') {
        tokens.push({ type: 'comma', value: char });
        i++;
        continue;
      }

      // Colon
      if (char === ':') {
        tokens.push({ type: 'colon', value: char });
        i++;
        continue;
      }

      // Unknown character
      i++;
    }
  } catch {
    // If parsing fails, return single text token
    tokens.push({ type: 'string', value: body });
  }

  return tokens;
}

/**
 * Get color for token type
 */
export function getTokenColor(tokenType: Token['type']): string {
  switch (tokenType) {
    case 'key':
      return '#CC8844'; // Primary
    case 'string':
      return '#99AA77'; // Green/success
    case 'number':
      return '#BB7733'; // Secondary
    case 'boolean':
    case 'null':
      return '#999999'; // Muted
    case 'bracket':
      return '#FFFFFF';
    case 'comma':
    case 'colon':
      return '#FFFFFF';
    case 'whitespace':
      return '#FFFFFF';
    default:
      return '#FFFFFF';
  }
}
