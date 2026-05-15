# Mailman Agent Guidelines
Operational guide for agentic coding assistants working in this repository.
Mailman is a terminal HTTP client built with Bun, OpenTUI, React, and strict TypeScript.

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

# Single test file
bun test src/core/services/http-client.test.ts
bun test src/modes/tui/components/BodyEditor.test.tsx

# Filter by test name
bun test -t "should make GET request"
```
Notes:
- There is no standalone `typecheck` script; `bun run lint` includes type checking.
- `bunfig.toml` preloads `test-setup.ts` for test runs.
- Prefer targeted test runs first, then full `bun test` before finishing.

## Project Map
```text
index.tsx                    Entry point, mode switch (tui/cli), renderer lifecycle
src/
  core/
    services/                HTTP, GraphQL, collections, history, preferences, import
    types/                   Request/response/auth/history domain types
    index.ts                 Barrel exports for core domain
  modes/
    tui/                     Main interactive terminal UI
      App.tsx               Top-level state, keyboard routing, modal orchestration
      components/           UI components (PascalCase.tsx + co-located tests)
      hooks/                TUI hooks (camelCase.ts)
    cli/                     CLI mode parser/commands/renderers
  shared/
    theme/                   ThemeProvider, color tokens, theme adapter, theme JSONs
    utils/                   Shared pure helpers (formatters, copy/curl utilities)
  types.ts                   Public compatibility exports
```

## TypeScript and Compiler Constraints
From `tsconfig.json`:
- `strict: true` is enabled; avoid `any` unless unavoidable.
- `verbatimModuleSyntax: true`: use `import type` for type-only imports.
- `noUncheckedIndexedAccess: true`: indexed values can be `undefined`; guard explicitly.
- `noImplicitOverride: true`: use `override` in class overrides.
- `noFallthroughCasesInSwitch: true`: no implicit switch fallthrough.
- JSX runtime uses `react-jsx` with `@opentui/react` via `jsxImportSource`.

## Code Style Guidelines
### Imports
- Use named imports.
- Use single quotes.
- Group imports: external packages first, then local modules.
- Keep local imports relative.
- Prefer one `import type` statement for grouped type imports.

### Formatting and Linting
- Formatting tool: `oxfmt`.
- Linting tool: `oxlint` with type-aware checks.
- Do not hand-format large diffs; run `bun run fmt`.
- Before finalizing, run `bun run fmt:check` and `bun run lint`.

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

### Module Boundaries
- Keep domain logic in `src/core/services`.
- Keep UI state and rendering in `src/modes/tui` and `src/modes/cli`.
- Keep reusable cross-mode helpers in `src/shared`.
- Use barrel exports (`index.ts`) for stable import surfaces.

## React + OpenTUI Patterns
- Use OpenTUI primitives (`box`, `text`, `input`, `scrollbox`) directly in JSX.
- Use `useKeyboard` for global shortcuts and modal escape behavior.
- Prefer functional components with hooks (`useState`, `useEffect`, `useCallback`, `useMemo`).
- Keep component flow: state/hooks -> handlers/helpers -> render.
- Use theme tokens from `ThemeProvider`; avoid hardcoded colors.
- `scrollbox` gotcha: avoid `flexDirection: 'column'` on `<scrollbox>` itself; wrap content in an inner `<box>` and style that.

## Types, State, and Async
- Explicitly type public function signatures.
- Use `Date.now().toString()` for lightweight IDs (current project convention).
- For fire-and-forget async effects/handlers, use `void` on async IIFEs.
- Avoid `.then/.catch` chains in app code; use `async/await`.
- Prefer immutable updates for object/array React state.

## Error Handling Rules
- Always catch operational errors at boundaries (network, fs, JSON parse).
- Normalize unknown exceptions with `error instanceof Error ? error.message : String(error)`.
- Log useful context with the error message.
- Return safe fallback values instead of throwing through UI paths.
- HTTP service layer represents failures as `status: 0` response-shaped objects.

## Storage and IO
- Persistent data is stored under `~/.mailman/`.
- Use async `fs/promises` operations for read/write flows.
- Ensure storage directories exist before writing.
- Serialize JSON with `JSON.stringify(data, null, 2)`.
- Validate parsed file content (shape checks, arrays, required fields) before use.

## Testing Guidance
- Test runner: `bun:test`.
- Common imports: `import { describe, test, expect, beforeEach, afterEach } from 'bun:test'`.
- Mock `globalThis.fetch` in service tests and restore it in `afterEach`.
- Keep tests deterministic; avoid real network or filesystem side effects when possible.
- Focused runs:
  - single file: `bun test path/to/file.test.ts`
  - name filter: `bun test -t "partial test name"`

## Agent Workflow Expectations
- Follow existing architecture and naming before introducing new patterns.
- Make the smallest safe change that solves the task.
- Prefer editing existing files over creating new abstractions unless clearly beneficial.
- Run relevant tests for touched areas; run full checks before claiming completion.
- If conventions conflict, prioritize observed code and compiler/lint rules.
