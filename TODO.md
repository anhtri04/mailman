# Mailman - Development Roadmap

A terminal-based HTTP client built with Bun and OpenTUI.

## Status

**Version:** 0.1.3
**Current State:** Core features complete. Ready for enhancement phase.

---

## Implemented (v0.1.0 - v0.1.3)

- [x] Split-screen layout (Request / Response panels)
- [x] Mouse + keyboard navigation
- [x] HTTP methods: GET, POST, PUT, DELETE, PATCH
- [x] Headers, Body, Query Params, Auth editors
- [x] Response viewer with syntax highlighting (JSON, XML, HTML)
- [x] Response tabs: Body, Headers, Raw
- [x] Collections with full CRUD
- [x] GraphQL support
- [x] Theme system (37 themes)
- [x] Bearer token & API key auth
- [x] Persistent storage (`~/.mailman/`)
- [x] Help modal (Ctrl+G)
- [x] Save requests to collections (Ctrl+S)
- [x] Response expansion (Space key)
- [x] Status code color coding
- [x] Content size & response time display

---

## Upcoming Features

### High Priority

- [ ] **Environment Variables**
  - `{{VARIABLE_NAME}}` substitution in URL, headers, body
  - Multiple environments (dev, staging, prod)
  - Editor modal to define key-value pairs
  - Persist to `~/.mailman/environments.json`

- [x] **curl Import / Export**
  - Export any request as a curl command
  - Parse and import curl commands into Mailman through the 'Add Request' panel
  - Copy to clipboard

- [X] **Basic & OAuth 2.0 Authentication**
  - Basic Auth with username/password (base64)
  - OAuth 2.0 flows (Client Credentials, Authorization Code)
  - Token refresh support

- [ ] **Multipart Form Data / File Uploads**
  - Support `multipart/form-data` content type
  - File selection for upload fields

- [X] **Postman / Insomnia Import**
  - Import `.json` collections from Postman v2.1
  - Import from Insomnia v4 format
  - Map auth, headers, and bodies

- [ ] **Collection Export**
  - Export collection in a standard format(Postman/Insomnia)
  - 

- [x] **Modal Closing when Mouse Focusing on other Panels**
  - When focus another Panel, the opening Modal will be closed(same when pressing esc)

- [ ] **Keyboard-first workflow**
  - Fast and muscle-memory driven
  - If users can test an endpoint in 3 keystrokes, we win

- [x] **CLI Mode**
  - Start with the command `mailman cli`
  - Quick entry using a mailman `REQUEST_COMMAND`
  - Fix text area and response pane
  - Leverage the use of `/command`

- [ ] **Web Scanning**
  - Integrate Vercel's Browser to API skill
  - Scan a web and then build collections from it

### Medium Priority

- [x] **Request History**
  - Auto-log last N requests
  - Quick re-run from history
  - Persist to `~/.mailman/history.json`
  - Modal viewer with search

- [ ] **Body Pretty Print / Format**
  - Auto-format JSON/XML in body editor
  - Minify button
  - Keyboard shortcut (e.g., Ctrl+Shift+F)

- [ ] **Cookie Jar & Session Support**
  - Store cookies between requests
  - Display response cookies in a tab
  - Enable/disable cookie jar per request

- [ ] **Request Timeout & Proxy Settings**
  - Configure timeout in UI (currently only in code)
  - HTTP/HTTPS proxy configuration
  - Persist settings

- [ ] **Response Download**
  - Save response body to file
  - Useful for images, binaries, large JSON
  - Shortcut: Ctrl+D when response focused

- [X] **Live Animated Instruction**
  - Replace the current static Instruction on top right corner
  - Implement a live Instruction with animation
  - This live Instruction is based on user actions

- [ ] **Loading Animation**
  - Add animation when loading or transiting

- [ ] **API Stress Test**
  - Implement a dedicated interface for API stress test
  - Support both CLI and TUI mode
  - Clone Apache Jmeter

### Low Priority

- [ ] **Collection Rename in UI**
  - Inline rename or modal
  - `updateCollectionName()` already exists in backend

- [ ] **Request Duplication**
  - Duplicate existing requests within a collection
  - Shortcut or context menu in CollectionPanel

- [ ] **Custom User-Agent**
  - Override default User-Agent header
  - Per-request or global setting

- [ ] **Response Diff / Compare**
  - Compare two responses side-by-side
  - Highlight differences

- [ ] **Request Templates / Snippets**
  - Common request patterns (e.g., JSON POST)
  - Quick insert from template library

- [ ] **Project / Github Repo Scanning**
  - Scan project and create API testing Collections automatically
  - Use command or directory path

- [ ] **Auto Complete and Auto Formatting**
  - When typing user can get auto complete
  - Auto format the body request, query and variables using keyboard shortcut

---

## Suggested Implementation Order

1. **Environment Variables** - Highest user value
2. **curl Export** - Quick win, high sharing value
3. **Basic Auth** - Simple addition, fills auth gap
4. **Body Pretty Print** - Quality of life improvement
5. **Multipart Uploads** - Enables more API use cases
6. **Postman Import** - Lowers barrier to entry / adoption
7. **Request History** - Convenience for iterative testing
8. **Cookie Jar** - Session-heavy APIs need this
9. **Proxy / Timeout Settings** - Corporate environment support
10. **Response Download** - Binary payload handling

---

## Development Guidelines

1. Read `AGENTS.md` for coding standards before starting
2. Write tests alongside features (TDD preferred)
3. Run `bun run fmt` and `bun run lint` before committing
4. Follow existing component patterns in `src/components/`
5. Co-locate tests: `Foo.tsx` -> `Foo.test.tsx`
6. Use `import type` for type-only imports (`verbatimModuleSyntax`)
7. Handle errors gracefully - never let exceptions crash the app
