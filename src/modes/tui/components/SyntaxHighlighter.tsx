// Syntax highlighter component for JSON, XML, and text content
import { useMemo } from 'react';
import { useTheme } from '../../../shared/theme/ThemeProvider';
import {
  parseJsonForHighlighting,
  getTokenColor,
  formatXml,
  formatJson,
} from '../../../shared/utils/response-formatter';
import type { ContentType } from '../../../shared/utils/response-formatter';

interface SyntaxHighlighterProps {
  code: string;
  language: ContentType;
}

interface HighlightedSegment {
  text: string;
  color: string;
}

function highlightJson(body: string): HighlightedSegment[] {
  const tokens = parseJsonForHighlighting(body);

  return tokens.map((token) => ({
    text: token.value,
    color: getTokenColor(token.type),
  }));
}

export function SyntaxHighlighter({ code, language }: SyntaxHighlighterProps) {
  const { colors } = useTheme();

  function highlightXml(body: string): HighlightedSegment[] {
    const formatted = formatXml(body);
    const segments: HighlightedSegment[] = [];
    let i = 0;

    while (i < formatted.length) {
      const char = formatted[i];
      if (char === undefined) break;

      // Tag detection
      if (char === '<') {
        // Find end of tag
        let tagContent = '<';
        i++;
        while (i < formatted.length && formatted[i] !== '>') {
          const tagChar = formatted[i];
          if (tagChar !== undefined) {
            tagContent += tagChar;
          }
          i++;
        }
        if (i < formatted.length) {
          const closing = formatted[i];
          if (closing === '>') {
            tagContent += '>';
            i++;
          }
        }

        // Tag color based on type
        let color: string = colors.text.primary as string; // Default brackets
        if (tagContent.startsWith('</')) {
          color = colors.accent.primary as string; // Closing tag
        } else if (tagContent.startsWith('<!--')) {
          color = colors.text.muted as string; // Comment
        } else if (tagContent.startsWith('<!')) {
          color = colors.text.muted as string; // DOCTYPE
        } else if (tagContent.startsWith('<?')) {
          color = colors.text.muted as string; // Processing instruction
        } else {
          color = colors.accent.primary as string; // Opening tag
        }

        segments.push({ text: tagContent, color });
      } else if (char === '"') {
        // String attribute value
        let value = '"';
        i++;
        while (i < formatted.length && formatted[i] !== '"') {
          const strChar = formatted[i];
          if (strChar !== undefined) {
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
          } else {
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
        segments.push({ text: value, color: colors.syntax.success });
      } else {
        // Regular text content
        let text = '';
        while (i < formatted.length && formatted[i] !== '<' && formatted[i] !== '"') {
          const textChar = formatted[i];
          if (textChar !== undefined) {
            text += textChar;
          }
          i++;
        }
        if (text) {
          segments.push({ text, color: colors.text.primary });
        }
      }
    }

    return segments;
  }

  function highlightPlainText(body: string): HighlightedSegment[] {
    return [{ text: body, color: colors.text.primary }];
  }

  const segments = useMemo(() => {
    switch (language) {
      case 'json':
        return highlightJson(code);
      case 'xml':
      case 'html':
        return highlightXml(code);
      case 'text':
      default:
        return highlightPlainText(code);
    }
  }, [code, language]);

  // Group segments by line for rendering
  const lines = useMemo(() => {
    const result: HighlightedSegment[][] = [];
    let currentLine: HighlightedSegment[] = [];

    for (const segment of segments) {
      const parts = segment.text.split('\n');

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (part === undefined) continue;

        if (part) {
          currentLine.push({ text: part, color: segment.color });
        }

        // If this part ends with a newline (except the last one), start new line
        if (i < parts.length - 1) {
          if (currentLine.length > 0) {
            result.push(currentLine);
          }
          currentLine = [];
        }
      }
    }

    if (currentLine.length > 0) {
      result.push(currentLine);
    }

    return result;
  }, [segments]);

  return (
    <box style={{ flexDirection: 'column' }}>
      {lines.map((lineSegments, lineIndex) => (
        <box key={lineIndex} style={{ flexDirection: 'row' }}>
          {lineSegments.map((segment, segmentIndex) => (
            <text key={segmentIndex} fg={segment.color}>
              {segment.text}
            </text>
          ))}
        </box>
      ))}
    </box>
  );
}
