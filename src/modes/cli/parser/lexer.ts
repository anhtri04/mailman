export interface InputToken {
  kind: 'word' | 'string' | 'flag';
  raw: string;
  value: string;
  start: number;
  end: number;
  closed: boolean;
}

export interface LexResult {
  raw: string;
  tokens: InputToken[];
  trailingWhitespace: boolean;
}

export function lexInput(raw: string): LexResult {
  const tokens: InputToken[] = [];
  let index = 0;

  while (index < raw.length) {
    const char = raw[index];
    if (char === undefined) break;

    if (/\s/.test(char)) {
      index++;
      continue;
    }

    const start = index;

    if (char === "'" || char === '"') {
      const quote = char;
      index++;
      let value = '';
      let closed = false;

      while (index < raw.length) {
        const current = raw[index];
        if (current === undefined) break;

        if (current === '\\') {
          const next = raw[index + 1];
          if (next !== undefined) {
            value += next;
            index += 2;
            continue;
          }
        }

        if (current === quote) {
          index++;
          closed = true;
          break;
        }

        value += current;
        index++;
      }

      tokens.push({
        kind: 'string',
        raw: raw.slice(start, index),
        value,
        start,
        end: index,
        closed,
      });
      continue;
    }

    let value = '';
    while (index < raw.length) {
      const current = raw[index];
      if (current === undefined || /\s/.test(current)) break;
      value += current;
      index++;
    }

    tokens.push({
      kind: value.startsWith('-') ? 'flag' : 'word',
      raw: raw.slice(start, index),
      value,
      start,
      end: index,
      closed: true,
    });
  }

  return {
    raw,
    tokens,
    trailingWhitespace: /\s$/.test(raw),
  };
}
