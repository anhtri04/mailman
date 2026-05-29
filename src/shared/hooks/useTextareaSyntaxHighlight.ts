import { useEffect, useMemo } from 'react';
import type { RefObject } from 'react';
import type { TextareaRenderable } from '@opentui/core';
import { useTheme } from '../theme/ThemeProvider';
import {
  createTextareaSyntaxStyle,
  tokenizeForTextareaHighlighting,
  type TextareaHighlightLanguage,
} from '../utils/textarea-highlighting';

interface UseTextareaSyntaxHighlightOptions {
  ref: RefObject<TextareaRenderable | null>;
  text: string;
  language: TextareaHighlightLanguage;
  enabled?: boolean;
  maxLength?: number;
}

export function useTextareaSyntaxHighlight({
  ref,
  text,
  language,
  enabled = true,
  maxLength = 100_000,
}: UseTextareaSyntaxHighlightOptions): void {
  const { colors } = useTheme();
  const syntaxStyle = useMemo(() => createTextareaSyntaxStyle(colors), [colors]);

  useEffect(() => {
    return () => {
      if (ref.current?.syntaxStyle === syntaxStyle) {
        ref.current.syntaxStyle = null;
      }
      syntaxStyle.destroy();
    };
  }, [ref, syntaxStyle]);

  useEffect(() => {
    const textarea = ref.current;
    if (!textarea) return;

    textarea.clearAllHighlights();

    if (!enabled || language === 'text' || text.length > maxLength) {
      return;
    }

    const tokens = tokenizeForTextareaHighlighting(text, language);
    if (tokens.length === 0) return;

    textarea.syntaxStyle = syntaxStyle;

    for (const token of tokens) {
      const styleId = syntaxStyle.getStyleId(token.style);
      if (styleId === null) continue;
      textarea.addHighlightByCharRange({
        start: token.start,
        end: token.end,
        styleId,
        priority: 1,
      });
    }
  }, [enabled, language, maxLength, ref, syntaxStyle, text]);
}
