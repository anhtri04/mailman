## Mailman v0.2.0

A terminal-based HTTP client built with Bun and OpenTUI.

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
- HTTP methods: GET, POST, PUT, DELETE, PATCH
- Headers, body, query params, and auth editors
- Syntax-highlighted response viewer
- Collections with full CRUD
- 37 built-in themes with live preview
- Persistent storage in `~/.mailman/`

### What's Changed

- GraphQL support is now first-class: protocol-aware request/response panels, variables handling, per-request response state, and GraphQL client/service test coverage.
- Auth support now includes Basic and OAuth2 (client credentials + authorization code) with token refresh and async auth resolution across REST, SSE, and GraphQL request paths.
- REST gained `text/event-stream` auto-detection with SSE parsing, incremental event rendering, and fixes to preserve events after stream completion.
- Collection workflows improved with import support (Postman + Insomnia for REST/GraphQL), quick cURL parsing, per-request cURL copy, and richer welcome-panel collection summaries.
- UI/UX updates include response-tab copy shortcuts (`Ctrl+C`), request history modal with redaction/search, global modal `[esc]` indicators, and multiple responsiveness/stability fixes.

