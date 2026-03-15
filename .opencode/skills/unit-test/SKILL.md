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
