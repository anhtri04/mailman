# Mailman Project Setup - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a new TUI HTTP client project called "mailman" with a complete agentic coding development environment following the restman pattern.

**Architecture:** Mailman will be a terminal-based HTTP client built with Bun, OpenTUI React, and TypeScript. The project structure follows restman's agentic coding approach with `.opencode/` configuration, specialized agents, and comprehensive guidelines in `AGENTS.md`.

**Tech Stack:** Bun runtime, OpenTUI React reconciler, TypeScript strict mode, oxfmt/oxlint for formatting/linting

---

## Task 1: Create Project Directory Structure

**Files:**
- Create: `mailman/` root directory
- Create: `mailman/src/` - source code
- Create: `mailman/src/components/` - React components
- Create: `mailman/src/utils/` - utility functions
- Create: `mailman/.opencode/agents/` - custom agents
- Create: `mailman/.opencode/skills/` - domain skills
- Create: `mailman/.opencode/commands/` - command shortcuts
- Create: `mailman/docs/plans/` - implementation plans

**Step 1: Create directory structure**

```bash
mkdir -p mailman/{src/{components,utils},.opencode/{agents,skills,commands},docs/plans}
```

**Step 2: Verify structure**

```bash
tree mailman -L 3
```

Expected output:
```
mailman/
├── docs/
│   └── plans/
├── src/
│   ├── components/
│   └── utils/
└── .opencode/
    ├── agents/
    ├── commands/
    └── skills/
```

**Step 3: Commit**

```bash
cd mailman && git init
git add .
git commit -m "chore: create mailman project structure"
```

---

## Task 2: Set Up TypeScript Configuration

**Files:**
- Create: `mailman/tsconfig.json`

**Step 1: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "lib": ["ESNext"],
    "target": "ESNext",
    "module": "Preserve",
    "moduleDetection": "force",
    "jsx": "react-jsx",
    "jsxImportSource": "@opentui/react",
    "allowJs": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "strict": true,
    "skipLibCheck": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noPropertyAccessFromIndexSignature": false
  }
}
```

**Step 2: Commit**

```bash
git add tsconfig.json
git commit -m "chore: add TypeScript configuration"
```

---

## Task 3: Create Package.json with Dependencies and Scripts

**Files:**
- Create: `mailman/package.json`

**Step 1: Create package.json**

```json
{
  "name": "mailman",
  "version": "0.0.1",
  "private": true,
  "description": "A terminal-based HTTP client built with Bun and OpenTUI",
  "license": "MIT",
  "type": "module",
  "scripts": {
    "dev": "bun run ./index.tsx",
    "start": "bun run ./index.tsx",
    "fmt": "oxfmt",
    "fmt:check": "oxfmt --check",
    "lint": "oxlint --type-aware --type-check",
    "lint:fix": "oxlint --fix",
    "test": "bun test"
  },
  "dependencies": {
    "@opentui/core": "^0.1.87",
    "@opentui/react": "^0.1.87",
    "react": "^19.2.4"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "@types/react": "^19.2.8",
    "oxfmt": "^0.26.0",
    "oxlint": "^1.41.0",
    "typescript": "^5"
  },
  "peerDependencies": {
    "typescript": "^5"
  }
}
```

**Step 2: Commit**

```bash
git add package.json
git commit -m "chore: add package.json with dependencies and scripts"
```

---

## Task 4: Create Code Quality Configuration Files

**Files:**
- Create: `mailman/.oxfmtrc.json`
- Create: `mailman/.oxlintrc.json`

**Step 1: Create .oxfmtrc.json**

```json
{
  "$schema": "./node_modules/oxfmt/configuration_schema.json",
  "ignorePatterns": ["*.md"],
  "singleQuote": true
}
```

**Step 2: Create .oxlintrc.json**

```json
{
  "ignorePatterns": []
}
```

**Step 3: Commit**

```bash
git add .oxfmtrc.json .oxlintrc.json
git commit -m "chore: add formatter and linter configuration"
```

---

## Task 5: Create AGENTS.md Guidelines Document

**Files:**
- Create: `mailman/AGENTS.md`

**Step 1: Create AGENTS.md**

```markdown
# Mailman Agent Guidelines

This document provides guidelines for AI agents working on the Mailman codebase.

## Build and Development Commands

```bash
# Run the application
bun run dev
bun start

# Format code
bun run fmt        # Format files with oxfmt
bun run fmt:check  # Check formatting without modifying

# Lint code
bun run lint       # Run oxlint with type checking
bun run lint:fix   # Fix linting issues automatically

# Run tests
bun test           # Run all tests
bun test --watch   # Watch mode
```

## Code Style Guidelines

### TypeScript Configuration
- Strict mode enabled with ESNext target
- React JSX with `@opentui/react` as import source
- `verbatimModuleSyntax: true` - no `import type` needed for type-only imports
- `noUncheckedIndexedAccess: true` - always handle undefined on indexed access

### Imports
- Use named imports: `import { useState } from 'react'`
- Single quotes only
- Group imports: external packages first, then local modules
- Local imports use relative paths: `import { App } from './src/App'`

### File Naming
- React components: PascalCase.tsx (e.g., `RequestPanel.tsx`)
- Utilities/services: camelCase.ts (e.g., `http-client.ts`, `storage.ts`)
- Hooks: camelCase.ts or camelCase.tsx if React types needed

### Naming Conventions
- Components: PascalCase (`RequestPanel`, `ResponseViewer`)
- Functions/hooks: camelCase (`sendRequest`, `useKeyboard`)
- Constants: UPPER_SNAKE_CASE (`MAILMAN_DIR`, `HISTORY_FILE`)
- Interfaces/Types: PascalCase (`RequestOptions`, `HistoryEntry`)
- State variables: camelCase with descriptive names (`focusedField`, `isEditing`)

### Component Structure
```typescript
// 1. Imports
import { useState, useCallback } from 'react';

// 2. Interfaces
interface ComponentProps {
  value: string;
  onChange: (value: string) => void;
}

// 3. Component function
export function Component({ value, onChange }: ComponentProps) {
  // Hooks first
  const [state, setState] = useState<string>('');

  // Helper functions
  const handleClick = useCallback(() => {
    // logic
  }, [dependencies]);

  // Return JSX
  return <box>{value}</box>;
}
```

### State Management
- Use React hooks: `useState`, `useEffect`, `useCallback`, `useKeyboard`
- Fire-and-forget async functions: prefix with `void` to avoid linter warnings
- Use `Date.now()` for unique IDs
- Default values for state initialization

### Async/Error Handling
- Use async/await pattern
- Check errors with `instanceof Error` before accessing `message`
- Log errors to console, return safe defaults
- Try-catch blocks should prevent crashes

```typescript
try {
  const result = await fetchData();
  return result;
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error('Operation failed:', errorMessage);
  return defaultValue;
}
```

### Formatting
- oxfmt with single quotes (`'`)
- Automatic formatting handles indentation and line breaks
- Markdown files are ignored from formatting

### OpenTUI/React Patterns
- Use `useKeyboard` hook for keyboard input
- Components render OpenTUI elements: `<box>`, `<text>`, `<input>`, `<scrollbox>`
- Style objects use kebab-case properties
- Color scheme: `#CC8844` (primary/focus), `#BB7733` (secondary/edit), `#555555` (borders), `#999999` (muted)
- Focus states use primary color
- Edit mode uses secondary color

### Storage/IO Operations
- Use `fs/promises` for async file operations
- Store data in `~/.mailman` directory
- Ensure directories exist with `mkdirSync(path, { recursive: true })`
- Validate loaded data structure before use
- JSON.stringify with `null, 2` for readable JSON files

### Type Safety
- Define interfaces for all data structures
- Use `Record<string, string>` for headers/variables
- Use discriminated unions for variants
- Export types when used across modules
```

**Step 2: Commit**

```bash
git add AGENTS.md
git commit -m "docs: add agent guidelines (AGENTS.md)"
```

---

## Task 6: Create OpenTUI Agent Configuration

**Files:**
- Create: `mailman/.opencode/agents/tui-dev.md`

**Step 1: Create tui-dev agent**

```markdown
---
description: Build and modify terminal user interfaces using OpenTUI with React. Use when implementing terminal UIs, TUIs, CLI applications, interactive terminal components, keyboard navigation, terminal styling, or working on Mailman UI features.
mode: subagent
---

You are an expert OpenTUI developer specializing in building terminal user interfaces using OpenTUI with React.

## Your Expertise

You specialize in:
- Building terminal UI applications with OpenTUI (React API)
- Implementing interactive terminal components (boxes, inputs, selects, tabs)
- Adding keyboard navigation and input handling
- Styling terminal interfaces with colors and borders
- Debugging rendering and layout issues
- Working on Mailman UI features

## OpenTUI Quick Reference

### Installation & Setup

```bash
# With React
bun install @opentui/react @opentui/core react
```

**TypeScript Config:**
```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@opentui/react"
  }
}
```

### Basic React App Structure

```tsx
import { createCliRenderer } from '@opentui/core'
import { createRoot } from '@opentui/react'

function App() {
  return <text>Hello, world!</text>
}

const renderer = await createCliRenderer({ exitOnCtrlC: false })
const root = createRoot(renderer)
root.render(<App />)
```

## Key Concepts

### Interactive Components MUST Be Focused

Components like `<input>`, `<select>`, and `<textarea>` **MUST be focused** to receive keyboard input:

```tsx
// React
<input focused={isFocused} />

// Core
input.focus()
```

### Mailman Color Scheme

Always use these colors for consistency:
- **Primary (focus):** `#CC8844`
- **Secondary (edit mode):** `#BB7733`
- **Borders:** `#555555`
- **Muted text:** `#999999`
- **Background:** `#1a1a1a`

## Common Components

### Text
```tsx
<text fg="#FFFF00" bold>Important Message</text>
```

### Box (Container)
```tsx
<box
  width={30}
  height={10}
  backgroundColor="#333366"
  borderStyle="single"
  borderColor="#FFFFFF"
  padding={2}
>
  {children}
</box>
```

### Input (Text Field)
```tsx
<input
  width={25}
  placeholder="Enter name..."
  onInput={(value) => setValue(value)}
  onSubmit={(value) => handleSubmit(value)}
  focused={isFocused}
/>
```

### TextArea (Multi-line Input)
```tsx
<textarea
  height={10}
  value={value}
  onInput={(value) => setValue(value)}
  focused={isFocused}
/>
```

## Keyboard Input

### React Hook (Recommended)

```tsx
import { useKeyboard } from '@opentui/react'

useKeyboard((key) => {
  if (key.name === 'escape') setShowModal(false)
  if (key.name === 'return') handleSubmit()
  if (key.name === 'tab') moveFocus()
  if (key.ctrl && key.name === 'c') console.log('Ctrl+C')
})
```

## Layout System

OpenTUI uses Yoga (CSS Flexbox) for layouts:

```tsx
<box flexDirection="row" justifyContent="space-between" alignItems="center">
  <box flexGrow={1} backgroundColor="#444" />
  <box width={20} backgroundColor="#666" />
</box>
```

**Common layout props:**
- `flexDirection`: `'row'` | `'column'`
- `justifyContent`: `'flex-start'` | `'center'` | `'space-between'` | etc.
- `alignItems`: `'flex-start'` | `'center'` | `'stretch'` | etc.
- `flexGrow`, `flexShrink`, `flexBasis`
- `width`, `height`, `padding`, `margin`

## React Hooks

- **useKeyboard(callback, options?)** - Handle keyboard input
- **useTerminalDimensions()** - Get terminal size
- **useRenderer()** - Access renderer instance
- **useOnResize(callback)** - Handle terminal resize

## Best Practices

1. **Always ensure focus:** Interactive components MUST be focused to work.
2. **Use Mailman colors:** Stick to the standard color scheme for consistency.
3. **Implement proper keyboard navigation:** Use `useKeyboard` hook in React.
4. **Style consistently:** Use kebab-case in style objects, direct props when possible.
5. **Use useCallback for handlers:** Prevents unnecessary re-renders in React.
6. **Fire-and-forget async:** Use `void asyncFunction()` to avoid lint warnings.
7. **Test in terminal:** Always test keyboard navigation flow.
8. **Handle modal keys separately:** Prevent conflicts with underlying UI.
9. **Exit edit mode with ESC:** Standard pattern for Mailman.

## Border Styles

Available border styles:
- `'single'` - Single line border
- `'double'` - Double line border
- `'rounded'` - Rounded corners
- `'bold'` - Bold line border
- `'none'` - No border
```

**Step 2: Commit**

```bash
git add .opencode/agents/tui-dev.md
git commit -m "chore: add OpenTUI agent configuration"
```

---

## Task 7: Create Unit Test Skill

**Files:**
- Create: `mailman/.opencode/skills/unit-test/SKILL.md`

**Step 1: Create unit-test skill**

```markdown
---
name: unit-test
description: Create comprehensive unit tests using Bun's test runner. Use when the user asks to create or fix unit tests or create test files.
compatibility: Requires Bun runtime for test execution
metadata:
  author: mailman
  version: "1.0"
  category: testing
---

## When to use this skill

Use this skill when:
- User asks to create or write unit tests
- User mentions testing, test coverage, or Bun test
- User wants to test specific functions, modules, or components
- User asks to add test files or improve test coverage

## Bun Test Framework

**Basic Testing**
```typescript
import { test, expect, describe } from 'bun:test';

describe('feature name', () => {
  test('should do something', () => {
    expect(result).toBe(expected);
  });
});
```

**Lifecycle Hooks**
- `beforeAll` - Setup before all tests
- `beforeEach` - Setup before each test
- `afterEach` - Cleanup after each test
- `afterAll` - Cleanup after all tests

**Mocking**
```typescript
import { test, expect, mock } from 'bun:test';

const mockFn = mock(() => 'mocked value');
```

## Running Tests

```bash
bun test              # Run all tests
bun test <filter>     # Run tests matching filter
bun test --watch      # Watch mode
bun test --coverage   # Generate coverage report
```

## Mailman-Specific Guidelines

- Follow TypeScript strict mode requirements
- Handle `noUncheckedIndexedAccess: true`
- Use async/await for asynchronous operations
- Mock file system operations (fs/promises)
- Test error handling with `instanceof Error` checks
```

**Step 2: Commit**

```bash
git add .opencode/skills/unit-test/SKILL.md
git commit -m "chore: add unit testing skill"
```

---

## Task 8: Create Entry Point (index.tsx)

**Files:**
- Create: `mailman/index.tsx`

**Step 1: Create entry point**

```tsx
#!/usr/bin/env bun

import { createCliRenderer } from '@opentui/core';
import { createRoot } from '@opentui/react';
import { App } from './src/App';

// Create the CLI renderer (async)
const renderer = await createCliRenderer({
  exitOnCtrlC: false, // We handle Ctrl+C in the app
  useAlternateScreen: true, // Enable fullscreen mode with alternate buffer
});

// Create and mount the React root
const root = createRoot(renderer);
root.render(<App />);

// Clean exit handler
const cleanExit = () => {
  root.unmount();
  renderer.destroy();
  process.exit(0);
};

// Handle cleanup on exit signals
process.on('SIGINT', cleanExit);
process.on('SIGTERM', cleanExit);

// Export cleanExit for use in App component
(globalThis as any).__mailmanCleanExit = cleanExit;
```

**Step 2: Commit**

```bash
git add index.tsx
git commit -m "feat: add entry point with OpenTUI setup"
```

---

## Task 9: Create Basic App Component

**Files:**
- Create: `mailman/src/App.tsx`

**Step 1: Create App component**

```tsx
import { useState } from 'react';
import { useKeyboard } from '@opentui/react';

export function App() {
  const [count, setCount] = useState(0);

  useKeyboard((key) => {
    if (key.name === 'q') {
      const cleanExit = (globalThis as any).__mailmanCleanExit;
      if (cleanExit) cleanExit();
    }
    if (key.name === 'space') {
      setCount((c) => c + 1);
    }
  });

  return (
    <box
      style={{
        flexDirection: 'column',
        padding: 2,
        backgroundColor: 'black',
      }}
    >
      <text fg="#CC8844" bold>
        Mailman v0.0.1
      </text>
      <text fg="#999999">
        Press SPACE to increment, Q to quit
      </text>
      <text fg="#FFFFFF">
        Count: {count}
      </text>
    </box>
  );
}
```

**Step 2: Commit**

```bash
git add src/App.tsx
git commit -m "feat: add basic App component"
```

---

## Task 10: Create .gitignore

**Files:**
- Create: `mailman/.gitignore`

**Step 1: Create .gitignore**

```
# Dependencies
node_modules/
*.lock

# Build outputs
dist/
*.exe

# Environment
.env
.env.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
*.log
logs/

# Test coverage
coverage/
```

**Step 2: Commit**

```bash
git add .gitignore
git commit -m "chore: add .gitignore"
```

---

## Task 11: Create README.md

**Files:**
- Create: `mailman/README.md`

**Step 1: Create README**

```markdown
# Mailman

A terminal-based HTTP client built with Bun and OpenTUI.

## Development

```bash
# Install dependencies
bun install

# Run in development mode
bun dev

# Format code
bun run fmt

# Lint code
bun run lint

# Run tests
bun test
```

## Architecture

- **Runtime:** Bun
- **UI Framework:** OpenTUI React reconciler
- **Language:** TypeScript with strict mode

## Project Structure

```
mailman/
├── src/              # Source code
│   ├── components/   # React components
│   └── utils/        # Utility functions
├── .opencode/        # Agent configuration
│   ├── agents/       # Custom agents
│   ├── skills/       # Domain skills
│   └── commands/     # Command shortcuts
├── docs/plans/       # Implementation plans
├── index.tsx         # Entry point
└── AGENTS.md         # Agent guidelines
```
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README"
```

---

## Task 12: Install Dependencies

**Step 1: Install dependencies**

```bash
bun install
```

Expected output:
```
bun install v1.x.x
+ @opentui/core@0.1.87
+ @opentui/react@0.1.87
+ react@19.2.4
...
```

**Step 2: Test the application**

```bash
bun dev
```

Expected: Terminal clears and shows:
```
Mailman v0.0.1
Press SPACE to increment, Q to quit
Count: 0
```

Press SPACE to see count increase, Q to quit.

**Step 3: Commit**

```bash
git add bun.lock
git commit -m "chore: install dependencies"
```

---

## Summary

You now have a complete agentic coding setup for Mailman with:

✅ **TypeScript strict configuration** - type-safe development
✅ **OpenTUI React setup** - TUI framework ready
✅ **Code quality tools** - oxfmt + oxlint
✅ **Agent system** - `.opencode/` with custom agents and skills
✅ **Working app** - entry point with basic functionality
✅ **Documentation** - AGENTS.md and README.md

Next steps:
1. Build core HTTP client features
2. Add request/response panels
3. Implement keyboard navigation
4. Add history and collections

Use the Task tool with the `tui-dev` agent for UI components!
