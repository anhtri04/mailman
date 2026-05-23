## Mailman v0.2.5

A terminal-based multi-protocol API client built with Bun and OpenTUI.

### Downloads

| Platform | File |
|----------|------|
| Windows (x64) | `mailman-win-x64.exe` |
| Linux (x64) | `mailman-linux-x64` |
| macOS (ARM64) | `mailman-darwin-arm64` |

### Quick Start

```bash
# Run directly (requires Bun)
bun install
bun dev

# Or download the standalone binary above — no runtime needed
chmod +x mailman-linux-x64  # macOS/Linux only
./mailman-linux-x64
```

### Features

- Interactive TUI with mouse and keyboard support
- REST, GraphQL, SSE response streaming, and WebSocket support
- HTTP methods: GET, POST, PUT, DELETE, PATCH
- Headers, body, query params, auth, and script editors
- WebSocket connect, send, receive, disconnect, and message history
- Pre-request and post-response scripts with test result viewing
- Syntax-highlighted response viewer
- Collections with full CRUD
- 37 built-in themes with live preview
- Persistent storage in `~/.mailman/`

### What's Changed

- Added request scripts support, including script types, persistence, collection/history plumbing, and request execution integration for REST and GraphQL.
- Added TUI script editing and test result panels, including scrollable results and show/hide controls for script snippets.
- Added an in-app notification panel with `info`, `success`, `warning`, and `error` variants.
- Added delete confirmation notifications for safer destructive actions.
- Added more built-in header presets for faster request setup.
- Fixed query params editor draft row handling.
- Fixed platform-specific cURL copy formatting.
- Fixed TUI collection method label colors and add request modal input padding.
- Refactored collection import and request adding views out of `App.tsx` for better maintainability.
- Expanded automated test coverage for scripts, notifications, cURL formatting, and extracted TUI views.
