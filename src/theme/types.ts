export interface OpencodeThemePalette {
  neutral: string;
  ink: string;
  primary: string;
  accent?: string;
  interactive?: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  diffAdd?: string;
  diffDelete?: string;
}

export interface OpencodeThemeOverrids {
  [key: string]: string;
}

export interface OpencodeThemeMode {
  palette: OpencodeThemePalette;
  overrides?: OpencodeThemeOverrids;
}

export interface OpencodeTheme {
  $schema: string;
  name: string;
  id: string;
  light: OpencodeThemeMode;
  dark: OpencodeThemeMode;
}

export interface MailmanColors {
  bg: {
    app: string;
    panel: string;
    deep: string;
    selection: string;
    focusHighlight: string;
    subtleRow: string;
  };
  border: {
    default: string;
    dim: string;
  };
  text: {
    primary: string;
    muted: string;
    dim: string;
    ghost: string;
  };
  accent: {
    primary: string;
    text: string;
    hover: string;
  };
  syntax: {
    success: string;
    warning: string;
    error: string;
    info: string;
    patch: string;
    punctuation: string;
  };
  methods: {
    GET: { bg: string; text: string };
    POST: { bg: string; text: string };
    PUT: { bg: string; text: string };
    DELETE: { bg: string; text: string };
    PATCH: { bg: string; text: string };
  };
}
