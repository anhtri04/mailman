## Mailman v0.2.7

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
- CLI command mode with parser-driven suggestions, virtual collection navigation, and themed output
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

- Added bash-like virtual filesystem navigation in CLI mode for collection and request browsing.
- Added protocol-aware CLI response rendering for REST, GraphQL, and SSE output.
- Added structured CLI response sections for status summaries, bodies, headers, request stats, stream metadata, and SSE events.
- Added JSON, XML, and body syntax formatting to CLI response output using the existing highlighter.
- Added collapsible response sections for long CLI outputs.
- Added a CLI theme selector command backed by shared modal and theme selector components.
- Added list viewport behavior to CLI input suggestions for improved keyboard navigation through long suggestion sets.

#### Changed

- Refined CLI input suggestions so they float over the output panel instead of consuming layout space.
- Reworked CLI output state to store structured response entries instead of preformatted response text.
- Shared modal and theme selector UI between TUI and CLI modes.
- Removed the unused command palette implementation and related tests.

#### Fixed

- Fixed empty CLI inputs so the suggestion panel no longer appears when there is nothing to suggest.

#### Documentation

- Updated agent/project guidance for the current Mailman workflow and architecture.
