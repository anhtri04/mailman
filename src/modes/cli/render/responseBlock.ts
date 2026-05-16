import type { ResponseState } from '../../../types';
import { formatBytes } from '../../../core/services';
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
    if (response.stats) {
      lines.push(`TTFB: ${response.stats.timings.ttfbMs ?? '-'}ms`);
      lines.push(`Download: ${response.stats.timings.downloadMs ?? '-'}ms`);
      lines.push(`Request size: ${formatBytes(response.stats.requestSize.totalBytes)}`);
      lines.push(`Response size: ${formatBytes(response.stats.responseSize.totalBytes)}`);
      lines.push(`Network: ${response.stats.network.protocol}//${response.stats.network.host}`);
    }
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
