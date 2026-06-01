## Mailman v0.2.10

### What's Changed

#### Added

- Added CLI SSE streaming support using `sendRequestWithStreaming()`, with streamed SSE events rendered in the existing CLI SSE Events section.
- Added CLI WebSocket request parsing support and request-type handling.
- Added CLI suggestions for WebSocket request commands.
- Added collapsible JSON tree rendering for REST and GraphQL response bodies in the TUI, with expand/collapse support and syntax-highlighted fallback for non-tree responses.
- Added persistent active-request highlighting in the TUI collection panel, so the selected collection request remains visible even when the panel loses focus.

#### Changed

- Removed a deprecated CLI response rendering utility.
- Reduced visual padding in the Welcome panel and Auth editor for a more compact UI.

#### Fixed

- Fixed button sizing in the headers editor.
- Fixed button sizing in the query params editor.

#### Tests

- Added JSON tree utility coverage for parsing, path handling, and collapsed-row visibility.
- Added CLI parser coverage for WebSocket request input.
- Added CLI suggestion coverage for WebSocket request commands.
