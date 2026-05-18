export const colors = {
  bg: {
    app: '#1a1a1e',
    panel: '#141418',
    deep: '#111114',
    selection: '#25252e',
    focusHighlight: '#2a2a38',
    subtleRow: '#1e1e28',
  },
  border: {
    default: '#2e2e38',
    dim: '#3a3a48',
  },
  text: {
    primary: '#c9c7be',
    muted: '#6a6a7a',
    dim: '#4a4a5a',
    ghost: '#3a3a48',
  },
  accent: {
    primary: '#3C3489',
    text: '#afa9ec',
    hover: '#534AB7',
  },
  syntax: {
    success: '#7db87d',
    warning: '#c9a060',
    error: '#d47070',
    info: '#6094c0',
    patch: '#8a7ed4',
    punctuation: '#5a5a6a',
  },
  methods: {
    GET: { bg: '#1e2d1a', text: '#7db87d' },
    POST: { bg: '#2e2516', text: '#c9a060' },
    PUT: { bg: '#152238', text: '#6094c0' },
    DELETE: { bg: '#2e1a1a', text: '#d47070' },
    DEL: { bg: '#2e1a1a', text: '#d47070' },
    PATCH: { bg: '#1e1e30', text: '#8a7ed4' },
    PTCH: { bg: '#1e1e30', text: '#8a7ed4' },
  },
} as const;

export const bg = colors.bg;
export const border = colors.border;
export const text = colors.text;
export const accent = colors.accent;
export const syntax = colors.syntax;
export const methods = colors.methods;

export type MethodBadge = typeof colors.methods;
