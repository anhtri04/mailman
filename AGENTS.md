# Mailman Agent Guidelines

Guidelines for AI agents working on the Mailman codebase — a terminal-based HTTP client built with Bun, OpenTUI, and React.

## Build and Development Commands

```bash
bun run dev          # Run the application (bun run ./index.tsx)
bun start            # Alias for dev
bun run fmt          # Format files with oxfmt
bun run fmt:check    # Check formatting without modifying
bun run lint         # Run oxlint with --type-aware --type-check
bun run lint:fix     # Auto-fix linting issues
bun test             # Run all tests
bun test --watch     # Run tests in watch mode
bun test src/services/http-client.test.ts   # Run a single test file
bun test -t "should make GET request"       # Run tests matching a name pattern
```

There is no standalone typecheck script — `bun run lint` includes `--type-check`.

## Project Structure

```
index.tsx               # Entry point — creates CLI renderer and React root
src/
  App.tsx               # Root component, keyboard bindings, modal routing
  types.ts              # Shared types (RequestOptions, ResponseState, Collection, etc.)
  components/           # React UI components (PascalCase.tsx)
    index.ts            # Barrel re-exports all components
  hooks/                # Custom React hooks (camelCase.ts)
    index.ts            # Barrel re-exports
  services/             # Business logic & IO (camelCase.ts)
    index.ts            # Barrel re-exports
  theme/                # Theme system — colors, types, ThemeProvider, adapters
  utils/                # Pure utility functions (camelCase.ts)
```

## TypeScript Configuration

- **Target**: ESNext with strict mode enabled
- **JSX**: `react-jsx` with `@opentui/react` as import source
- **`verbatimModuleSyntax: true`** — you MUST use `import type` for type-only imports:
  ```typescript
  import type { RequestOptions } from '../types';   // correct
  import { RequestOptions } from '../types';          // wrong — will fail
  ```
- **`noUncheckedIndexedAccess: true`** — always handle `undefined` on indexed access (e.g. `arr[0]!` or explicit check)
- **`noImplicitOverride: true`** — use `override` keyword when overriding
- **`noFallthroughCasesInSwitch: true`** — no implicit fallthrough
- No separate emit (`noEmit: true`), Bun handles execution directly

## Code Style

### Imports
- Named imports only: `import { useState } from 'react'`
- Single quotes throughout (enforced by oxfmt)
- Group order: external packages → local modules
- Type-only imports use `import type`
- Local paths are relative: `import { App } from './src/App'`

### Formatting
- oxfmt with `singleQuote: true`; markdown files are ignored
- No manual formatting — always run `bun run fmt` before committing

### Naming Conventions
| Kind | Style | Example |
|---|---|---|
| Components | PascalCase | `RequestPanel`, `ResponseViewer` |
| Functions / hooks | camelCase | `sendRequest`, `useFocus` |
| Constants | UPPER_SNAKE_CASE | `MAILMAN_DIR`, `DEFAULT_TIMEOUT` |
| Interfaces / Types | PascalCase | `RequestOptions`, `MailmanColors` |
| Type aliases (unions) | PascalCase | `AuthType`, `FocusArea` |
| Files — components | PascalCase.tsx | `AuthEditor.tsx` |
| Files — utils/services/hooks | camelCase.ts | `http-client.ts`, `useFocus.ts` |
| Test files | co-located | `AuthEditor.test.tsx` next to `AuthEditor.tsx` |

### Component Structure
```typescript
import { useState, useCallback } from 'react';
import type { RequestOptions } from '../types';

interface ComponentProps {
  value: string;
  onChange: (value: string) => void;
}

export function Component({ value, onChange }: ComponentProps) {
  const [state, setState] = useState<string>('');

  const handleClick = useCallback(() => {
    // logic
  }, [dependencies]);

  return <box>{value}</box>;
}
```

- Hooks before helpers, helpers before JSX
- Export components as named exports (never default)
- Barrel re-exports via `index.ts` in each directory

### Barrel Exports (index.ts)
Every module directory has an `index.ts` that re-exports public API:
```typescript
export { sendRequest } from './http-client';
export { loadCollections, addCollection } from './collection';
```

## React / OpenTUI Patterns

- Use `useKeyboard` from `@opentui/react` for global key bindings
- Render OpenTUI primitives: `<box>`, `<text>`, `<input>`, `<scrollbox>`
- Style objects use camelCase CSS-like properties: `flexDirection`, `backgroundColor`
- Colors come from the theme system — use `useTheme()` hook, not hardcoded values
- Method colors: `colors.methods.GET.text`, `colors.methods.POST.bg`, etc.
- `as const` for static color/theme objects

## State Management

- React hooks only: `useState`, `useEffect`, `useCallback`
- Unique IDs: `Date.now().toString()`
- Fire-and-forget async: wrap with `void` to suppress linter warnings:
  ```typescript
  void (async () => { await doAsyncThing(); })();
  ```
- Escape key closes modals; check modal state in `useKeyboard` handler

## Error Handling

```typescript
try {
  const result = await fetchData();
  return result;
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error('Operation failed:', message);
  return defaultValue;
}
```

- Always use async/await (never raw `.then`/`.catch`)
- Classify errors before surfacing (see `http-client.ts: classifyError`)
- Never let exceptions crash the app — always catch and return a safe fallback
- HTTP errors return `ResponseState` with `status: 0` instead of throwing

## Storage / IO

- Use `fs/promises` for async reads/writes (`readFile`, `writeFile`)
- Use `fs` sync for directory creation: `mkdirSync(path, { recursive: true })`
- Data stored in `~/.mailman/` directory
- JSON files: `JSON.stringify(data, null, 2)` for readability
- Validate loaded JSON before use (check `Array.isArray`, etc.)

## Testing

- Framework: Bun test runner (`bun:test`)
- Imports: `import { test, expect, describe, beforeEach, afterEach } from 'bun:test'`
- Test preload: `bunfig.toml` loads `test-setup.ts` (happy-dom + React act environment)
- Test files are co-located next to source: `Foo.tsx` → `Foo.test.tsx`
- For hooks: test module structure and simulate logic without React runtime
- For services: mock `globalThis.fetch` with `beforeEach`/`afterEach` cleanup

## Linting Rules

- Run `bun run lint` before committing — it includes type checking
- Run `bun run fmt:check` to verify formatting
- Fix automatically with `bun run lint:fix` and `bun run fmt`

## Gotchas Mistakes

- When using <scrollbox>, don't put flexDirection: 'column' into its properties, this can cause broken responsiveness, with the list a scrollbar being treated as 2 seperate objects in a flex column axis. Instead, add this properties to a <box> object within it.