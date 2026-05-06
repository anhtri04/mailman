import { adjustLightness } from './color-utils';
import type { MailmanColors, OpencodeTheme } from './types';

export function adaptTheme(theme: OpencodeTheme): MailmanColors {
  const p = theme.dark.palette;

  return {
    bg: {
      app: p.neutral,
      panel: adjustLightness(p.neutral, -5),
      deep: adjustLightness(p.neutral, -10),
      selection: adjustLightness(p.neutral, 8),
      focusHighlight: adjustLightness(p.neutral, 12),
      subtleRow: adjustLightness(p.neutral, 5),
    },
    border: {
      default: adjustLightness(p.neutral, 15),
      dim: adjustLightness(p.neutral, 8),
    },
    text: {
      primary: p.ink,
      muted: adjustLightness(p.ink, -35),
      dim: adjustLightness(p.ink, -50),
      ghost: adjustLightness(p.ink, -65),
    },
    accent: {
      primary: p.primary,
      text: adjustLightness(p.primary, 15),
      hover: p.accent,
    },
    syntax: {
      success: p.success,
      warning: p.warning,
      error: p.error,
      info: p.info,
      patch: p.diffAdd ?? p.accent,
      punctuation: adjustLightness(p.ink, -25),
    },
    methods: {
      GET: { bg: adjustLightness(p.success, -35), text: p.success },
      POST: { bg: adjustLightness(p.warning, -35), text: p.warning },
      PUT: { bg: adjustLightness(p.info, -35), text: p.info },
      DELETE: { bg: adjustLightness(p.error, -35), text: p.error },
      PATCH: { bg: adjustLightness(p.accent, -35), text: p.accent },
    },
  };
}
