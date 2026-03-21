import type { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/**
 * Reusable Modal component for Mailman HTTP client.
 *
 * This modal is used for:
 * - Request editors (Headers, Body, Query)
 * - Response expanded view
 *
 * Keyboard handling:
 * - Escape key should be handled by the parent component and call onClose()
 * - This component only renders when isOpen is true
 *
 * Styling:
 * - Primary color (#CC8844) for title and border
 * - Dark background (#1a1a1a)
 * - Centered on screen at 80% width/height
 */
export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  // Don't render if modal is closed
  if (!isOpen) {
    return null;
  }

  return (
    <box
      style={{
        position: 'absolute',
        top: '10%',
        left: '10%',
        width: '80%',
        height: '80%',
        backgroundColor: '#1a1a1a',
        border: true,
        borderColor: '#CC8844',
        padding: 1,
      }}
    >
      <box style={{ flexDirection: 'column', height: '100%' }}>
        {/* Title bar */}
        {/* <box style={{ flexDirection: 'row', marginBottom: 1 }}>
          <text fg="#CC8844">
            <strong>{title}</strong>
          </text>
        </box> */}
        {children}

        {/* Scrollable content area */}
        {/* <scrollbox style={{ flexGrow: 1, flexDirection: 'column' }}>{children}</scrollbox> */}
      </box>
    </box>
  );
}
