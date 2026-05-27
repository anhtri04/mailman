import type { ResponseState } from '../../../core/types';
import type { CliResponseProtocol, CliResponseSectionId, CliViewToggles } from '../types';

export function getCliResponseSectionIds(
  response: ResponseState,
  protocol: CliResponseProtocol,
  toggles: CliViewToggles,
): CliResponseSectionId[] {
  const sections: CliResponseSectionId[] = [];

  if (response.mode === 'sse') {
    if (toggles.showBody) sections.push('events');
    if (toggles.showHeaders) sections.push('headers');
    if (toggles.showMeta) {
      sections.push('streamMeta');
      sections.push('stats');
    }
    return sections;
  }

  if (toggles.showBody) {
    if (protocol === 'graphql') {
      try {
        const parsed = JSON.parse(response.body) as unknown;
        const isRecord = parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed);
        const data = isRecord ? (parsed as Record<string, unknown>).data : undefined;
        const errors = isRecord ? (parsed as Record<string, unknown>).errors : undefined;
        if (data !== undefined || errors !== undefined) {
          sections.push('data');
          sections.push('errors');
        } else {
          sections.push('body');
        }
      } catch {
        sections.push('body');
      }
    } else {
      sections.push('body');
    }
  }

  if (toggles.showHeaders) sections.push('headers');
  if (toggles.showMeta) sections.push('stats');

  return sections;
}

export function getCliResponseSectionDefaultCollapsed(
  response: ResponseState,
  protocol: CliResponseProtocol,
  sectionId: CliResponseSectionId,
): boolean {
  if (sectionId === 'headers' || sectionId === 'stats' || sectionId === 'streamMeta') return true;

  if (sectionId !== 'errors' || protocol !== 'graphql') return false;

  try {
    const parsed = JSON.parse(response.body) as unknown;
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return true;
    const errors = (parsed as Record<string, unknown>).errors;
    if (Array.isArray(errors)) return errors.length === 0;
    return errors === undefined;
  } catch {
    return true;
  }
}

export function getCliSectionKey(responseId: string, sectionId: CliResponseSectionId): string {
  return `${responseId}:${sectionId}`;
}
