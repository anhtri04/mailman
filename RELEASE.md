## Mailman v0.2.11

### What's Changed

#### Added

- Added a TUI request document modal for collection requests, including Markdown preview support and keyboard shortcut/instruction updates.
- Added collapsible JSON tree rendering for CLI JSON responses using the shared JSON tree viewer.
- Added JSON tree rendering inside the TUI response modal.
- Added tab keyboard navigation to the TUI response modal.

#### Changed

- Updated OpenTUI dependencies to version 0.3.4.
- Shared the JSON tree viewer between TUI and CLI response rendering.
- Added a Buy Me a Coffee badge to the README.

#### Fixed

- Fixed Markdown preview style keys in the request document modal.
- Adjusted response panel margins for improved TUI layout in REST and GraphQL response panels.

#### Tests

- Added keyboard shortcut coverage for the request document modal.
- Added instruction text coverage for the request document modal.
- Expanded JSON tree utility coverage for CLI/shared response rendering.
