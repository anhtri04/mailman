# Mailman Agent Guidelines
Operational guide for agentic coding assistants working in this repository.

Mailman is a Bun-powered terminal HTTP client built with OpenTUI, React, and strict TypeScript. It has two runtime modes:
- **TUI mode**: the default full-screen interactive HTTP client.
- **CLI mode**: `bun run dev:cli`, a command/request prompt with parser-driven suggestions.

## Build, Lint, and Test Commands
```bash
bun install

# Run app
bun run dev
bun start
bun run dev:cli

# Build executable
bun run build

# Formatting / linting
bun run fmt
bun run fmt:check
bun run lint
bun run lint:fix

# Test suite
bun test
bun test --watch

# Focused tests
bun test src/core/services/http-client.test.ts
bun test src/modes/tui/components/BodyEditor.test.tsx
bun test -t "should make GET request"
```
Notes:
- There is no standalone `typecheck` script; `bun run lint` runs `oxlint --type-aware --type-check`.
- `bunfig.toml` preloads `test-setup.ts`, which installs a `happy-dom` React test environment.
- Prefer targeted tests for touched files first, then `bun test`, `bun run fmt:check`, and `bun run lint` before finishing.
- `dist/` contains build output; do not edit generated artifacts unless the task explicitly asks for release/build output.

## Project Map
```text
index.tsx                    Entry point; chooses TUI vs CLI mode and owns renderer lifecycle
src/
  core/
    services/                Domain/IO services: HTTP, GraphQL, WebSocket, SSE parsing,
                             collections, history, preferences, import, scripts, request stats
    types/                   Request/response/auth/history/collection/script domain types
    index.ts                 Core barrel exports
  modes/
    tui/
      App.tsx                Top-level TUI state, keyboard routing, modal orchestration
      components/            PascalCase OpenTUI React components + co-located tests
      hooks/                 TUI hooks such as focus and keyboard shortcuts
      utils/                 TUI-only helpers such as contextual instruction text
    cli/
      CliApp.tsx             CLI-mode root component
      commands/              Slash command registry and handlers
      components/            CLI input/output components
      hooks/                 CLI session/suggestion state hooks
      parser/                Lexer, unified input parser, request parser, suggestions
      render/                CLI output render helpers
      shell/                 Virtual collection/request filesystem helpers
  shared/
    components/              Cross-mode UI components
    theme/                   ThemeProvider, tokens, adapter, built-in JSON themes
    utils/                   Cross-mode pure helpers for formatting, copying, viewport math
  types.ts                   Compatibility/public exports

docs/
  cli-input-grammar.md       Source of truth for CLI parser and suggestion behavior
  example-collections.json   Example persisted collection data
sample-collection/           Postman/Insomnia REST and GraphQL import samples
scripts/seed-collections.ts  Development seeding helper
```

## Domain Model and Protocol Notes
- Collections store `RequestItem`s with `protocol: 'rest' | 'graphql' | 'websocket'`.
- CLI request parsing currently models REST, GraphQL, and SSE; the CLI grammar is documented in `docs/cli-input-grammar.md`.
- REST bodies support `none`, `raw`, `urlencoded`, `file`, and `multipart` modes via `src/core/services/request-body.ts`.
- Response state supports single responses, SSE streams, WebSocket messages, request stats, and before/after script results.
- Network and protocol logic belongs in `src/core/services`; UI components should consume services rather than duplicating protocol behavior.
- Prefer importing stable domain APIs from `src/core` or `src/core/services` barrels when they already export what you need.

## TypeScript and Compiler Constraints
From `tsconfig.json`:
- `strict: true` is enabled; avoid `any` unless unavoidable.
- `verbatimModuleSyntax: true`: use `import type` for type-only imports.
- `noUncheckedIndexedAccess: true`: indexed values can be `undefined`; guard explicitly.
- `noImplicitOverride: true`: use `override` in class overrides.
- `noFallthroughCasesInSwitch: true`: no implicit switch fallthrough.
- JSX runtime uses `react-jsx` with `@opentui/react` via `jsxImportSource`.
- `moduleResolution: "bundler"`, `module: "Preserve"`, and `allowImportingTsExtensions: true` are intentional for Bun.

## Code Style Guidelines
### Imports
- Use named imports.
- Use single quotes.
- Group imports: external packages first, then local modules.
- Keep local imports relative.
- Prefer one grouped `import type` statement for type-only imports.

### Formatting and Linting
- Formatting tool: `oxfmt`; `.oxfmtrc.json` uses single quotes and ignores Markdown.
- Linting tool: `oxlint` with type-aware checks.
- Do not hand-format large diffs; run `bun run fmt` when code formatting is needed.

### Naming Conventions
| Item | Convention | Example |
|---|---|---|
| Components | PascalCase | `RequestPanel.tsx` |
| Hooks / functions | camelCase | `useFocus`, `sendRequest` |
| Constants | UPPER_SNAKE_CASE | `SSE_MAX_EVENTS` |
| Types / interfaces | PascalCase | `RequestOptions`, `ResponseState` |
| Component files | PascalCase.tsx | `HistoryModal.tsx` |
| Non-component files | kebab/camel case as existing | `http-client.ts`, `commandParser.ts` |
| Tests | co-located `*.test.ts(x)` | `AuthEditor.test.tsx` |

## Module Boundaries
- Keep domain logic and filesystem/network IO in `src/core/services`.
- Keep domain shapes in `src/core/types`; update barrel exports when adding reusable types.
- Keep TUI state/rendering in `src/modes/tui` and CLI state/rendering in `src/modes/cli`.
- Keep reusable cross-mode helpers in `src/shared`.
- If CLI syntax changes, update parser tests and `docs/cli-input-grammar.md` together.
- Avoid introducing new global state; prefer React state/hooks or explicit service functions.

## React + OpenTUI Patterns
- Use OpenTUI primitives (`box`, `text`, `input`, `scrollbox`) directly in JSX.
- Use `useKeyboard`/project hooks for global shortcuts and modal escape behavior.
- Prefer functional components with hooks (`useState`, `useEffect`, `useCallback`, `useMemo`).
- Keep component flow: state/hooks -> derived values -> handlers/helpers -> render.
- Use theme tokens from `ThemeProvider`; avoid hardcoded colors unless matching existing theme infrastructure.
- `scrollbox` gotcha: avoid `flexDirection: 'column'` on `<scrollbox>` itself; wrap content in an inner `<box>` and style that.
- TUI tests run in `happy-dom`; keep tests deterministic and avoid depending on real terminal capabilities.

## Types, State, and Async
- Explicitly type public function signatures and exported helpers.
- Use `Date.now().toString()` for lightweight IDs where the project already follows that convention.
- For fire-and-forget async effects/handlers, use `void` on async IIFEs.
- Avoid `.then/.catch` chains in app code; use `async/await`.
- Prefer immutable updates for object/array React state.
- Cleanup protocol controllers/streams in effects when components unmount or sessions end.

## Error Handling Rules
- Always catch operational errors at boundaries (network, protocol streams, fs, JSON parse, script execution).
- Normalize unknown exceptions with `error instanceof Error ? error.message : String(error)`.
- Log useful context with the error message.
- Return safe fallback values instead of throwing through UI paths.
- HTTP service-layer failures are represented as response-shaped objects with `status: 0`.

## Storage and IO
- Persistent app data is stored under `~/.mailman/`.
- Use async `fs/promises` operations for read/write flows.
- Ensure storage directories exist before writing.
- Serialize JSON with `JSON.stringify(data, null, 2)`.
- Validate parsed file content shape before use; tolerate older collection formats where existing import/load code does.
- Use the sample collections in `sample-collection/` when testing import flows.

## Testing Guidance
- Test runner: `bun:test`.
- Common imports: `import { describe, test, expect, beforeEach, afterEach } from 'bun:test'`.
- Mock `globalThis.fetch` in service tests and restore it in `afterEach`.
- Avoid real network and persistent filesystem side effects in tests; use temp dirs or mocks where possible.
- Add or update co-located tests when changing parser behavior, services, hooks, or UI component behavior.
- Focused runs:
  - single file: `bun test path/to/file.test.ts`
  - test name filter: `bun test -t "partial test name"`

## Agent Workflow Expectations
- Inspect existing architecture and naming before introducing new patterns.
- Make the smallest safe change that solves the task.
- Prefer editing existing files over creating new abstractions unless clearly beneficial.
- Keep README/docs in sync with user-visible commands, CLI grammar, and behavior changes.
- Run relevant tests for touched areas; run full checks before claiming completion when practical.
- If conventions conflict, prioritize observed code, compiler/lint rules, and nearby tests.
