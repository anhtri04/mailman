import type { ReactNode } from 'react';
import { useTheme } from '../../../shared/theme/ThemeProvider';

export type NotificationVariant = 'info' | 'success' | 'warning' | 'error';

export interface NotificationAction {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

interface NotificationProps {
  isOpen: boolean;
  title: string;
  message?: string;
  variant?: NotificationVariant;
  actions?: NotificationAction[];
  onClose?: () => void;
  children?: ReactNode;
}

function getVariantIcon(variant: NotificationVariant): string {
  switch (variant) {
    case 'success':
      return '✓';
    case 'warning':
      return '!';
    case 'error':
      return '×';
    case 'info':
      return 'i';
  }
}

export function Notification({
  isOpen,
  title,
  message,
  variant = 'info',
  actions = [],
  onClose,
  children,
}: NotificationProps) {
  const { colors } = useTheme();

  if (!isOpen) {
    return null;
  }

  const variantColor =
    variant === 'error'
      ? colors.syntax.error
      : variant === 'warning'
        ? colors.syntax.warning
        : variant === 'success'
          ? colors.syntax.success
          : colors.accent.primary;

  return (
    <box
      style={{
        position: 'absolute',
        top: '35%',
        left: '30%',
        width: '40%',
        backgroundColor: colors.bg.panel,
        border: true,
        borderColor: variantColor,
        borderStyle: 'rounded',
        padding: 1,
      }}
    >
      <box style={{ flexDirection: 'column', gap: 1 }}>
        <box style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <box style={{ flexDirection: 'row', gap: 1 }}>
            <text fg={variantColor}>{getVariantIcon(variant)}</text>
            <text fg={variantColor}>
              <strong>{title}</strong>
            </text>
          </box>
          {onClose && (
            <box onMouseDown={onClose}>
              <text fg={colors.text.muted}>[esc]</text>
            </box>
          )}
        </box>

        {message && <text fg={colors.text.primary}>{message}</text>}
        {children}

        {actions.length > 0 && (
          <box style={{ flexDirection: 'row', gap: 1, justifyContent: 'flex-end' }}>
            {actions.map((action) => {
              const actionColor =
                action.variant === 'danger'
                  ? colors.syntax.error
                  : action.variant === 'secondary'
                    ? colors.text.muted
                    : colors.accent.primary;

              return (
                <box
                  key={action.label}
                  style={{
                    border: true,
                    borderColor: actionColor,
                    borderStyle: 'rounded',
                    paddingLeft: 2,
                    paddingRight: 2,
                  }}
                  onMouseDown={action.onPress}
                >
                  <text fg={actionColor}>{action.label}</text>
                </box>
              );
            })}
          </box>
        )}
      </box>
    </box>
  );
}
