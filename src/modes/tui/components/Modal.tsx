import type { ReactNode } from 'react';
import { useTheme } from '../../../theme/ThemeProvider';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

/**
 * Reusable Modal component for Mailman HTTP client.
 *
 * This modal is used for:
 * - Request editors (Headers, Body, Query)
 * - Response expanded view
 * - Other pop up panels (import/export, collection settings, etc.)
 *
 * Keyboard handling:
 * - Escape key should be handled by the parent component and call onClose()
 * - This component only renders when isOpen is true
 *
 * Styling:
 * - Primary color (colors.accent.primary) for title and border
 * - Dark background (colors.bg.panel)
 * - Centered on screen at 80% width/height
 */
export function Modal({ isOpen, onClose, title, subtitle, children }: ModalProps) {
  // Don't render if modal is closed
  if (!isOpen) {
    return null;
  }

  const { colors } = useTheme();

  return (
    <box
      style={{
        position: 'absolute',
        top: '10%',
        left: '10%',
        width: '80%',
        height: '80%',
        backgroundColor: colors.bg.panel,
        border: true,
        borderColor: colors.accent.primary,
        padding: 1,
      }}
    >
      <box style={{ flexDirection: 'column', height: '100%' }}>
        {/* Title bar */}
        <box style={{ flexDirection: 'row', marginBottom: 1, justifyContent: 'space-between' }}>
          <box style={{ flexDirection: 'row' }}>
            <text fg={colors.accent.primary}>
              <strong>{title}</strong>
            </text>
            {subtitle && (
              <text fg={colors.text.muted} style={{ marginLeft: 2 }}>
                {subtitle}
              </text>
            )}
          </box>
          <text fg={colors.text.muted} style={{ marginLeft: 2 }}>
            [esc]
          </text>
        </box>
        {children}

        {/* Scrollable content area */}
        {/* <scrollbox style={{ flexGrow: 1, flexDirection: 'column' }}>{children}</scrollbox> */}
      </box>
    </box>
  );
}
