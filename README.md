<h1 align="center">Mailman</h1>

<div align="center">

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.2.10-blue.svg)](https://github.com/anhtri04/mailman)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6.svg)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Runtime-Bun-000000?logo=bun)](https://bun.sh)
[![BuyMeACoffee](https://raw.githubusercontent.com/pachadotdev/buymeacoffee-badges/main/bmc-yellow.svg)](https://buymeacoffee.com/anhtri04)

</div>

<p align="center">
  A Bun-powered terminal HTTP client built with OpenTUI, React, and strict TypeScript.
</p>

<p align="center">
  <img src="mailman.png" alt="Mailman terminal HTTP client" width="900" />
</p>

## Highlights

- **Interactive terminal UI** — Full-screen HTTP client with keyboard and mouse-friendly controls.
- **Multiple request protocols** — REST, GraphQL, WebSocket collections, and SSE stream parsing support.
- **Request builder** — Headers, query params, auth, scripts, and body editors in one terminal workflow.
- **Flexible bodies** — Raw, URL-encoded, file, and multipart request body modes.
- **Response viewer** — Status, timing, size, headers, raw output, formatted body, stream events, and copy helpers.
- **Collections and history** — Save, import/export, reopen, and organize requests under `~/.mailman/`.
- **CLI mode** — Parser-driven command/request prompt with suggestions for REST, GraphQL, and SSE requests.
- **Theme system** — Built-in themes with live preview via `Ctrl+T`.

## Quick Start

### Requirements

- [Bun](https://bun.sh) installed locally.

### Run the TUI

```bash
bun install
bun run dev
```

You can also use:

```bash
bun start
```

### Run CLI mode

```bash
bun run dev:cli
```

Example CLI requests:

```bash
http rest GET https://api.example.com/users
http rest POST https://api.example.com/users --json '{"name":"Mailman"}'
http graphql https://api.example.com/graphql --query 'query { viewer { login } }'
http sse https://api.example.com/events
```

See [`docs/cli-input-grammar.md`](docs/cli-input-grammar.md) for the full CLI grammar.

## Showcase

The current README uses `mailman.png` as the hero image. For a stronger project showcase, add a small gallery under `docs/assets/showcase/` and keep file names stable so links do not break.

Suggested screenshots/GIFs to capture:

| Asset | What to show | Suggested file |
|---|---|---|
| Main TUI | Collection panel, request panel, and response panel together | `docs/assets/showcase/main-tui.png` |
| Request editing | Headers/body/query/auth modal workflow | `docs/assets/showcase/request-editor.gif` |
| GraphQL | Query + variables editor and formatted response | `docs/assets/showcase/graphql.png` |
| Streaming | SSE events or live stream response state | `docs/assets/showcase/streaming.gif` |
| Themes | Theme selector preview | `docs/assets/showcase/themes.png` |
| CLI mode | Suggestions and command execution | `docs/assets/showcase/cli-mode.gif` |

Recommended Markdown/HTML layout once those assets exist:

```html
<p align="center">
  <img src="docs/assets/showcase/main-tui.png" alt="Mailman main TUI" width="49%" />
  <img src="docs/assets/showcase/graphql.png" alt="Mailman GraphQL request" width="49%" />
</p>
<p align="center">
  <img src="docs/assets/showcase/request-editor.gif" alt="Editing requests in Mailman" width="49%" />
  <img src="docs/assets/showcase/cli-mode.gif" alt="Mailman CLI mode" width="49%" />
</p>
```

Tips:

- Prefer short GIFs for flows and PNG/WebP for static screens.
- Use terminal dimensions around `120x36` for readable screenshots.
- Avoid secrets, private URLs, or personal collection data.
- Compress images before committing so the repository stays lightweight.

## Usage

### Keyboard shortcuts

| Key | Action |
|---|---|
| `Ctrl+Q` | Quit application |
| `Ctrl+T` | Open theme selector |
| `Ctrl+G` | Open help/catalog panel |
| `Ctrl+R` | Open request history |
| `Ctrl+S` | Save current request to its collection |
| `Ctrl+C` | Copy response content when available |
| `Tab` | Switch response tabs / focus response controls |
| `Space` | Expand response to full-screen modal when focused |
| `Escape` | Close modal / go back |
| `Ctrl+F` | Format supported editors such as JSON/GraphQL bodies |

### Request workflow

1. Select or create a collection.
2. Add a REST, GraphQL, or WebSocket request.
3. Configure the URL, method/protocol, headers, query parameters, auth, body, and scripts.
4. Send the request from the request panel.
5. Inspect the response body, headers, raw view, stats, or stream events.
6. Press `Ctrl+S` to persist changes to the selected collection.

### Authentication

| Mode | Behavior |
|---|---|
| **No Auth** | Send requests without authentication |
| **Bearer Token** | Adds `Authorization: Bearer <token>` header |
| **API Key (Header)** | Adds a custom header such as `X-API-Key: <value>` |
| **API Key (Query)** | Appends the key to the URL query string |

### Collections

- Import sample or existing collections from the collection panel.
- Add requests manually or prefill from cURL when creating a request.
- Select a saved request to load it into the request panel.
- Export collections when you need to share or back them up.
- Persistent app data is stored under `~/.mailman/`.

## Development

```bash
bun install          # Install dependencies
bun run dev          # Run the TUI application
bun start            # Run the TUI application
bun run dev:cli      # Run CLI mode
bun run build        # Build executable to dist/mailman
bun run seed         # Load example collections into ~/.mailman/

bun test             # Run all tests
bun test --watch     # Run tests in watch mode
bun test src/core/services/http-client.test.ts
bun test -t "should make GET request"

bun run fmt          # Format code with oxfmt
bun run fmt:check    # Check formatting without modifying
bun run lint         # Lint with oxlint, including type-aware checks
bun run lint:fix     # Auto-fix linting issues
```

## Architecture

| Layer | Technology |
|---|---|
| Runtime | [Bun](https://bun.sh) |
| UI framework | [OpenTUI](https://opentui.org) React reconciler |
| Language | TypeScript strict mode |
| Testing | Bun test runner with happy-dom setup |
| Formatting | oxfmt |
| Linting | oxlint |

## Project Structure

```text
index.tsx                    Entry point; chooses TUI or CLI mode
src/
  core/
    services/                HTTP, GraphQL, WebSocket, SSE, storage, import, history, scripts
    types/                   Request, response, auth, collection, history, and script types
  modes/
    tui/                     Full-screen interactive app
      components/            OpenTUI React components
      hooks/                 TUI keyboard/focus hooks
      utils/                 TUI-specific helpers
    cli/                     Parser-driven CLI mode
      commands/              Slash command registry and handlers
      parser/                Lexer, parser, suggestions
      shell/                 Virtual collection/request filesystem helpers
  shared/
    components/              Cross-mode editors and modals
    theme/                   Theme provider, colors, built-in JSON themes
    utils/                   Formatting, copying, viewport, and highlighting helpers
docs/                        CLI grammar, examples, and planning notes
sample-collection/           Postman/Insomnia import samples
scripts/                     Development utilities
```

## License

[MIT](LICENSE)
