## Mailman v0.2.6

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
- Headers, structured request bodies, query params, auth, and script editors
- Raw, URL-encoded, file, and multipart form-data request body modes
- WebSocket connect, send, receive, disconnect, and message history
- Pre-request and post-response scripts with test result viewing
- Syntax-highlighted response viewer
- Collections with full CRUD
- 37 built-in themes with live preview
- Persistent storage in `~/.mailman/`

### What's Changed

#### Added

- Added a first-class structured `RequestBody` model for REST requests.
- Added request body modes for raw text, `application/x-www-form-urlencoded`, file uploads, and `multipart/form-data` with text and file fields.
- Added request body building utilities that convert structured body data into fetch-compatible payloads while preserving request statistics previews.
- Added CLI parsing support for structured/raw request bodies.
- Added a reusable list viewport utility for scrollable selectors, with integration in the theme selector, file browser, history modal, and collection panel.
- Added script indicators to requests shown in the welcome panel.

#### Fixed

- Fixed Body Editor responsiveness and button clipping in scrollable body modes.
- Fixed background focus and keyboard routing while overlays and modals are open.
- Fixed tab highlighting so request panels reset correctly after modals close.
- Fixed duplicate Escape handling in the theme selector.
- Fixed response panel expansion when pressing Space while editing a request body.
- Fixed GraphQL response modal expansion and tab behavior.
- Updated TUI shortcut instructions for response/body interactions.

#### Documentation

- Updated project TODO notes for the v0.2.6 workstream.
