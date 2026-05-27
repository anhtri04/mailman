## Mailman v0.2.8

### What's Changed

#### Added

- Added keyboard-first CLI output navigation for moving through structured response sections without leaving the keyboard.
- Added CLI response-section metadata to support focused navigation across status summaries, bodies, headers, stats, stream metadata, and events.
- Added an `Enter` shortcut for selecting themes in the shared theme selector.

#### Changed

- Improved CLI output and input panel layout behavior so long output content no longer shrinks or breaks the input panel.
- Improved TUI response panel layout for REST, GraphQL, and WebSocket responses so large content no longer shrinks tab controls.
- Updated service tests to align with the current structured `RequestBody` model.

#### Fixed

- Fixed CLI request suggestions appearing in an edge case after a completed `cd` command.
- Fixed theme selector initialization so the currently active theme is selected when opening the modal.
- Fixed modal and response-panel sizing behavior for large response content.
