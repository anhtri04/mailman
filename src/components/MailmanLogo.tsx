import { colors } from '../theme/colors';

const LOGO_LINES = [
  '███╗   ███╗ █████╗ ██╗██╗     ███╗   ███╗ █████╗ ███╗   ██╗',
  '████╗ ████║██╔══██╗██║██║     ████╗ ████║██╔══██╗████╗  ██║',
  '██╔████╔██║███████║██║██║     ██╔████╔██║███████║██╔██╗ ██║',
  '██║╚██╔╝██║██╔══██║██║██║     ██║╚██╔╝██║██╔══██║██║╚██╗██║',
  '██║ ╚═╝ ██║██║  ██║██║███████╗██║ ╚═╝ ██║██║  ██║██║ ╚████║',
  '╚═╝     ╚═╝╚═╝  ╚═╝╚═╝╚══════╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝'
                                                           
];

export function MailmanLogo() {
  return (
    <box style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
      <box style={{ flexDirection: 'column', alignItems: 'center' }}>
        {LOGO_LINES.map((line, i) => (
          <text key={i} fg={colors.accent.text}>{line}</text>
        ))}
        <text fg={colors.border.dim}>{'─'.repeat(47)}</text>
        <text fg={colors.text.dim} style={{ marginTop: 1 }}>
          API testing in your terminal
        </text>
      </box>
    </box>
  );
}
