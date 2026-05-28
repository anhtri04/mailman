import { Modal } from './Modal';
import { useTheme } from '../theme/ThemeProvider';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { colors } = useTheme();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings">
      <box
        style={{
          flexDirection: 'column',
          height: '100%',
          minHeight: 0,
          backgroundColor: colors.bg.panel,
        }}
      />
    </Modal>
  );
}
