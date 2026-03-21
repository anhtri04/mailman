import { useCallback, useRef } from 'react';
import type { TextareaRenderable } from '@opentui/core';

interface BodyEditorProps {
  body: string;
  onBodyChange: (body: string) => void;
  focused: boolean;
  detectedContentType?: string;
}

function detectContentType(body: string): string {
  const trimmed = body.trim();

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return 'application/json';
  }

  if (trimmed.includes('=')) {
    return 'application/x-www-form-urlencoded';
  }

  return 'text/plain';
}

export function BodyEditor({ body, onBodyChange, focused, detectedContentType }: BodyEditorProps) {
  const borderColor = focused ? '#CC8844' : '#555555';
  const contentType = detectedContentType ?? detectContentType(body);
  const charCount = body.length;
  const textareaRef = useRef<TextareaRenderable>(null);

  const handleContentChange = useCallback(() => {
    if (textareaRef.current) {
      const newText = textareaRef.current.plainText;
      onBodyChange(newText);
    }
  }, [onBodyChange]);

  return (
    <box
      style={{
        flexDirection: 'column',
        // border: true,
        // borderColor,
        padding: 1,
        flexGrow: 1,
        marginTop: 1,
      }}
    >
      <box
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 1,
        }}
      >
        <text fg="#CC8844">
          <strong>Body</strong>
        </text>
        <text fg="#999999">{contentType}</text>
      </box>

      <box
        style={{
          flexGrow: 1,
          border: true,
          borderColor: focused ? '#CC8844' : '#555555',
          backgroundColor: '#1a1a1a',
        }}
      >
        <scrollbox style={{ flexGrow: 1 }}>
          <textarea
            ref={textareaRef}
            initialValue={body}
            placeholder="Enter request body..."
            focused={focused}
            onContentChange={handleContentChange}
            backgroundColor="#1a1a1a"
            textColor="#FFFFFF"
            placeholderColor="#666666"
          />
        </scrollbox>
      </box>

      <box
        style={{
          flexDirection: 'row',
          justifyContent: 'flex-end',
          marginTop: 1,
        }}
      >
        <text fg="#999999">{charCount} chars</text>
      </box>
    </box>
  );
}
