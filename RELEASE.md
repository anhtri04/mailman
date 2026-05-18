## Mailman v0.2.4

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
- Headers, body, query params, and auth editors
- WebSocket connect, send, receive, disconnect, and message history
- Syntax-highlighted response viewer
- Collections with full CRUD
- 37 built-in themes with live preview
- Persistent storage in `~/.mailman/`

### What's Changed

- Added WebSocket TUI client support with dedicated request and response panels.
- WebSocket sessions now support connect, send, receive, disconnect, clear messages, and live inbound/outbound/system message rendering.
- Added request-level protocol foundation for REST, GraphQL, and WebSocket requests.
- Added WebSocket history summaries, including message count and session duration.
- Kept SSE as part of REST response streaming instead of a standalone request protocol.
- Added WebSocket service and TUI test coverage.
