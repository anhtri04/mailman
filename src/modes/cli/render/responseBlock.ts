import type { ResponseState } from '../../../types';
import { detectContentType, formatResponseBody } from '../../../shared/utils/response-formatter';
import type { CliViewToggles } from '../types';

interface RequestMeta {
  method: string;
  url: string;
}

function divider(title: string): string {
  return `+---- ${title} ${'-'.repeat(Math.max(0, 62 - title.length))}`;
}

export function renderResponseBlock(
  response: ResponseState,
  toggles: CliViewToggles,
  requestMeta: RequestMeta,
): string {
  const lines: string[] = [];
  lines.push(divider('Response'));
  lines.push(`Status: ${response.status} ${response.statusText} | Time: ${response.time}ms`);

  if (toggles.showMeta) {
    lines.push(divider('Meta'));
    lines.push(`${requestMeta.method} ${requestMeta.url}`);
  }

  if (toggles.showHeaders) {
    lines.push(divider('Headers'));
    for (const [key, value] of Object.entries(response.headers)) {
      lines.push(`${key}: ${value}`);
    }
    if (Object.keys(response.headers).length === 0) {
      lines.push('[no headers]');
    }
  }

  if (toggles.showBody) {
    lines.push(divider('Body'));
    const contentType = detectContentType(response.headers, response.body);
    const formatted = formatResponseBody(response.body, contentType);
    lines.push(formatted || '[empty body]');
  }

  lines.push('+----------------------------------------------------------------------');
  return lines.join('\n');
}
