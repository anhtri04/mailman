## Mailman v0.2.9

### What's Changed

#### Added

- Added CLI request history support with `/history`, including persisted REST, GraphQL, and SSE responses and selectable history snapshots in the output panel.
- Added SQLite-backed request history storage for more durable and scalable history persistence.
- Added CLI request editor commands for opening headers, body, params, GraphQL query/variables, auth, and scripts editors, plus `/save` (`/w`) to persist edits back to the current request.
- Added a scaffolded CLI settings panel available via `/settings`.
- Added focused TUI request-panel keyboard shortcuts for opening editor tabs (`h`, `b`, `q`, `a`, `s` where supported).

#### Changed

- Shared request editor components, history modal, directory hooks, and textarea highlighting utilities between TUI and CLI code paths.
- Expanded the CLI output panel height and improved suggestion-panel visibility management.
- Improved CLI output readability by using distinct colors for command entries, system messages, and errors.

#### Fixed

- Fixed TUI tab button sizing in response panels and modals.

#### Tests

- Added coverage for CLI request editor commands, history behavior, command registration, and focused request-panel shortcuts.
