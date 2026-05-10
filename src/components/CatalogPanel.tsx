import { useTheme } from '../theme/ThemeProvider';

interface CatalogPanelProps {
  onClose: () => void;
}

export function CatalogPanel({ onClose }: CatalogPanelProps) {
  const { colors } = useTheme();

  return (
    <box style={{ flexDirection: 'column', height: '100%', gap: 1 }}>
      <scrollbox style={{ flexGrow: 1, marginBottom: -1 }}>
        <box style={{ flexDirection: 'column', gap: 1 }}>
          <box style={{ flexDirection: 'column', gap: 1 }}>
            <text fg={colors.accent.primary}>
              <strong>Overview</strong>
            </text>
            <text fg={colors.text.primary}>
              Mailman is a terminal-based HTTP client for testing APIs, navigating collections, and
              inspecting responses — all without leaving the command line.
            </text>
          </box>

          <box style={{ flexDirection: 'column', gap: 1 }}>
            <text fg={colors.accent.primary}>
              <strong>Navigation Shortcuts</strong>
            </text>
            <text fg={colors.text.primary}>• ↑ / ↓ Navigate collections and requests</text>
            <text fg={colors.text.primary}>• Tab Switch focus between panels</text>
            <text fg={colors.text.primary}>• Enter Open a collection or request</text>
            <text fg={colors.text.primary}>• Esc Close modals / go back</text>
            <text fg={colors.text.primary}>• Space Expand response (when focused)</text>
          </box>

          <box style={{ flexDirection: 'column', gap: 1 }}>
            <text fg={colors.accent.primary}>
              <strong>Global Shortcuts</strong>
            </text>
            <text fg={colors.text.primary}>• Ctrl+Q Quit application</text>
            <text fg={colors.text.primary}>• Ctrl+T Change theme</text>
            <text fg={colors.text.primary}>• Ctrl+S Save request changes</text>
            <text fg={colors.text.primary}>• Ctrl+G Open this help panel</text>
          </box>

          <box style={{ flexDirection: 'column', gap: 1 }}>
            <text fg={colors.accent.primary}>
              <strong>Request / Response Panels</strong>
            </text>
            <text fg={colors.text.primary}>
              • URL bar: type an endpoint and press Enter to send
            </text>
            <text fg={colors.text.primary}>• Method selector: cycle with &lt; / &gt; keys</text>
            <text fg={colors.text.primary}>
              • H / B / Q / A buttons edit headers, body, query, or auth
            </text>
            <text fg={colors.text.primary}>
              • Response panel shows status, time, body, and headers
            </text>
          </box>

          <box style={{ flexDirection: 'column', gap: 1 }}>
            <text fg={colors.accent.primary}>
              <strong>Collections</strong>
            </text>
            <text fg={colors.text.primary}>• Use Import to create a new collection</text>
            <text fg={colors.text.primary}>
              • Add requests inside a collection to save them for later
            </text>
            <text fg={colors.text.primary}>
              • Selecting a request automatically loads its configuration
            </text>
            <text fg={colors.text.primary}>
              • Ctrl+S saves the current request back to its collection
            </text>
          </box>

          <box style={{ flexDirection: 'column', gap: 1 }}>
            <text fg={colors.accent.primary}>
              <strong>Tips</strong>
            </text>
            <text fg={colors.text.primary}>
              • The sidebar can be collapsed to give more room for responses
            </text>
            <text fg={colors.text.primary}>
              • Themes adapt syntax highlighting and method colors
            </text>
            <text fg={colors.text.primary}>• All request data is stored in ~/.mailman/</text>
          </box>
        </box>
      </scrollbox>
    </box>
  );
}
