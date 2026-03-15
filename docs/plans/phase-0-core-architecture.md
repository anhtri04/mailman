# Phase 0: Core Architecture Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create the foundational UI with split-screen layout, mouse-first navigation, and basic input components for a terminal-based HTTP client.

**Architecture:** Two-panel layout using OpenTUI React - RequestPanel (top, 40%) for URL/method inputs and ResponsePanel (bottom, 60%) for response display. Mouse interactions via `onMouseDown` props on `<box>` elements. Focus management tracks which panel is active.

**Tech Stack:** Bun runtime, OpenTUI React reconciler, TypeScript strict mode, Bun test framework

---

## Task 1: Create Types Definition File

**Files:**
- Create: `src/types.ts`

**Step 1: Write the type definitions**

```typescript
// Request and response types for the HTTP client

export interface RequestOptions {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: string;
}

export interface ResponseState {
  status: number;
  statusText: string;
  body: string;
  headers: Record<string, string>;
  time: number;
}

export type FocusArea = 'request' | 'response' | null;

export interface AppState {
  focusedArea: FocusArea;
  request: RequestOptions;
  response: ResponseState | null;
  isLoading: boolean;
}
```

**Step 2: Verify TypeScript compiles**

Run: `bun run tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/types.ts
git commit -m "feat: add core type definitions for requests and responses"
```

---

## Task 2: Create Focus Management Hook

**Files:**
- Create: `src/hooks/useFocus.ts`
- Test: `src/hooks/useFocus.test.ts`

**Step 1: Write the failing test**

```typescript
import { test, expect, describe } from 'bun:test';
import { renderHook, act } from '@testing-library/react';
import { useFocus } from './useFocus';

describe('useFocus', () => {
  test('should initialize with null focus', () => {
    const { result } = renderHook(() => useFocus());
    expect(result.current.focusedArea).toBeNull();
  });

  test('should set focus area', () => {
    const { result } = renderHook(() => useFocus());
    
    act(() => {
      result.current.setFocus('request');
    });
    
    expect(result.current.focusedArea).toBe('request');
  });

  test('should clear focus', () => {
    const { result } = renderHook(() => useFocus());
    
    act(() => {
      result.current.setFocus('request');
      result.current.clearFocus();
    });
    
    expect(result.current.focusedArea).toBeNull();
  });

  test('should check if area is focused', () => {
    const { result } = renderHook(() => useFocus());
    
    act(() => {
      result.current.setFocus('response');
    });
    
    expect(result.current.isFocused('response')).toBe(true);
    expect(result.current.isFocused('request')).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test src/hooks/useFocus.test.ts`
Expected: FAIL - "Cannot find module"

**Step 3: Write the hook implementation**

```typescript
import { useState, useCallback } from 'react';
import type { FocusArea } from '../types';

interface UseFocusReturn {
  focusedArea: FocusArea;
  setFocus: (area: FocusArea) => void;
  clearFocus: () => void;
  isFocused: (area: FocusArea) => boolean;
}

export function useFocus(): UseFocusReturn {
  const [focusedArea, setFocusedArea] = useState<FocusArea>(null);

  const setFocus = useCallback((area: FocusArea) => {
    setFocusedArea(area);
  }, []);

  const clearFocus = useCallback(() => {
    setFocusedArea(null);
  }, []);

  const isFocused = useCallback((area: FocusArea): boolean => {
    return focusedArea === area;
  }, [focusedArea]);

  return {
    focusedArea,
    setFocus,
    clearFocus,
    isFocused,
  };
}
```

**Step 4: Run test to verify it passes**

Run: `bun test src/hooks/useFocus.test.ts`
Expected: PASS - All 4 tests pass

**Step 5: Commit**

```bash
git add src/hooks/useFocus.ts src/hooks/useFocus.test.ts
git commit -m "feat: add useFocus hook for focus management"
```

---

## Task 3: Create RequestPanel Component

**Files:**
- Create: `src/components/RequestPanel.tsx`
- Test: `src/components/RequestPanel.test.tsx`

**Step 1: Write the failing test**

```typescript
import { test, expect, describe } from 'bun:test';
import { render } from '@testing-library/react';
import { RequestPanel } from './RequestPanel';

describe('RequestPanel', () => {
  const defaultProps = {
    focused: false,
    onFocus: () => {},
    url: '',
    onUrlChange: () => {},
    method: 'GET',
    onMethodChange: () => {},
    onSend: () => {},
  };

  test('should render URL input', () => {
    const { container } = render(<RequestPanel {...defaultProps} />);
    expect(container.textContent).toContain('URL');
  });

  test('should render method selector', () => {
    const { container } = render(<RequestPanel {...defaultProps} />);
    expect(container.textContent).toContain('GET');
  });

  test('should render send button', () => {
    const { container } = render(<RequestPanel {...defaultProps} />);
    expect(container.textContent).toContain('Send');
  });

  test('should have different border color when focused', () => {
    const { container: focusedContainer } = render(
      <RequestPanel {...defaultProps} focused={true} />
    );
    const { container: unfocusedContainer } = render(
      <RequestPanel {...defaultProps} focused={false} />
    );
    
    // Focused should have primary color (#CC8844)
    expect(focusedContainer.innerHTML).toContain('#CC8844');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test src/components/RequestPanel.test.tsx`
Expected: FAIL - "Cannot find module"

**Step 3: Write the component implementation**

```tsx
import type { RequestOptions } from '../types';

interface RequestPanelProps {
  focused: boolean;
  onFocus: () => void;
  url: string;
  onUrlChange: (url: string) => void;
  method: string;
  onMethodChange: (method: string) => void;
  onSend: () => void;
}

const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

export function RequestPanel({
  focused,
  onFocus,
  url,
  onUrlChange,
  method,
  onMethodChange,
  onSend,
}: RequestPanelProps) {
  const borderColor = focused ? '#CC8844' : '#555555';

  return (
    <box
      style={{
        flexDirection: 'column',
        border: true,
        borderColor,
        padding: 1,
        flexGrow: 1,
      }}
      onMouseDown={onFocus}
    >
      {/* Header */}
      <text fg="#CC8844" bold>
        Request
      </text>

      {/* Method and URL row */}
      <box style={{ flexDirection: 'row', gap: 1, marginTop: 1 }}>
        {/* Method selector */}
        <box
          style={{
            border: true,
            borderColor: '#555555',
            paddingLeft: 1,
            paddingRight: 1,
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            // Cycle to next method
            const currentIndex = METHODS.indexOf(method);
            const nextIndex = (currentIndex + 1) % METHODS.length;
            onMethodChange(METHODS[nextIndex]);
          }}
        >
          <text fg="#FFFFFF">{method}</text>
        </box>

        {/* URL input */}
        <box
          style={{
            flexGrow: 1,
            border: true,
            borderColor: '#555555',
            paddingLeft: 1,
            paddingRight: 1,
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
        >
          <text fg={url ? '#FFFFFF' : '#666666'}>
            {url || 'Enter URL...'}
          </text>
        </box>
      </box>

      {/* Send button */}
      <box
        style={{
          marginTop: 1,
          border: true,
          borderColor: '#CC8844',
          backgroundColor: '#CC8844',
          paddingLeft: 2,
          paddingRight: 2,
          alignSelf: 'flex-start',
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          onSend();
        }}
      >
        <text fg="#000000" bold>
          Send
        </text>
      </box>
    </box>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `bun test src/components/RequestPanel.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/RequestPanel.tsx src/components/RequestPanel.test.tsx
git commit -m "feat: add RequestPanel component with mouse interaction"
```

---

## Task 4: Create ResponsePanel Component

**Files:**
- Create: `src/components/ResponsePanel.tsx`
- Test: `src/components/ResponsePanel.test.tsx`

**Step 1: Write the failing test**

```typescript
import { test, expect, describe } from 'bun:test';
import { render } from '@testing-library/react';
import { ResponsePanel } from './ResponsePanel';

describe('ResponsePanel', () => {
  const defaultProps = {
    focused: false,
    onFocus: () => {},
    response: null,
  };

  test('should render empty state', () => {
    const { container } = render(<ResponsePanel {...defaultProps} />);
    expect(container.textContent).toContain('Response');
    expect(container.textContent).toContain('No response yet');
  });

  test('should render response when available', () => {
    const response = {
      status: 200,
      statusText: 'OK',
      body: '{"message": "success"}',
      headers: {},
      time: 150,
    };
    
    const { container } = render(
      <ResponsePanel {...defaultProps} response={response} />
    );
    
    expect(container.textContent).toContain('200');
    expect(container.textContent).toContain('OK');
    expect(container.textContent).toContain('message');
  });

  test('should have different border color when focused', () => {
    const { container: focusedContainer } = render(
      <ResponsePanel {...defaultProps} focused={true} />
    );
    
    expect(focusedContainer.innerHTML).toContain('#CC8844');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test src/components/ResponsePanel.test.tsx`
Expected: FAIL

**Step 3: Write the component implementation**

```tsx
import type { ResponseState } from '../types';

interface ResponsePanelProps {
  focused: boolean;
  onFocus: () => void;
  response: ResponseState | null;
}

export function ResponsePanel({ focused, onFocus, response }: ResponsePanelProps) {
  const borderColor = focused ? '#CC8844' : '#555555';

  return (
    <box
      style={{
        flexDirection: 'column',
        border: true,
        borderColor,
        padding: 1,
        flexGrow: 1,
      }}
      onMouseDown={onFocus}
    >
      {/* Header */}
      <box style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <text fg="#CC8844" bold>
          Response
        </text>
        {response && (
          <text fg="#999999">
            {response.time}ms
          </text>
        )}
      </box>

      {/* Content */}
      <box style={{ flexGrow: 1, marginTop: 1 }}>
        {response ? (
          <box style={{ flexDirection: 'column' }}>
            {/* Status line */}
            <text fg={response.status < 400 ? '#99AA77' : '#AA5555'}>
              {response.status} {response.statusText}
            </text>
            
            {/* Body */}
            <box style={{ marginTop: 1, flexGrow: 1 }}>
              <text fg="#FFFFFF">
                {response.body}
              </text>
            </box>
          </box>
        ) : (
          <text fg="#666666">
            No response yet. Send a request to see results.
          </text>
        )}
      </box>
    </box>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `bun test src/components/ResponsePanel.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/ResponsePanel.tsx src/components/ResponsePanel.test.tsx
git commit -m "feat: add ResponsePanel component with mouse interaction"
```

---

## Task 5: Update App.tsx with Layout and State Management

**Files:**
- Modify: `src/App.tsx`
- Test: `src/App.test.tsx`

**Step 1: Write the failing test**

```typescript
import { test, expect, describe } from 'bun:test';
import { render } from '@testing-library/react';
import { App } from './App';

describe('App', () => {
  test('should render RequestPanel', () => {
    const { container } = render(<App />);
    expect(container.textContent).toContain('Request');
  });

  test('should render ResponsePanel', () => {
    const { container } = render(<App />);
    expect(container.textContent).toContain('Response');
  });

  test('should have Send button', () => {
    const { container } = render(<App />);
    expect(container.textContent).toContain('Send');
  });

  test('should show quit instructions', () => {
    const { container } = render(<App />);
    expect(container.textContent).toContain('Press Q to quit');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test src/App.test.tsx`
Expected: FAIL - Tests don't match new implementation

**Step 3: Write the updated App component**

```tsx
import { useState, useCallback } from 'react';
import { useKeyboard } from '@opentui/react';
import { useFocus } from './hooks/useFocus';
import { RequestPanel } from './components/RequestPanel';
import { ResponsePanel } from './components/ResponsePanel';
import type { RequestOptions, ResponseState } from './types';

export function App() {
  const { focusedArea, setFocus, isFocused } = useFocus();
  const [request, setRequest] = useState<RequestOptions>({
    method: 'GET',
    url: '',
  });
  const [response, setResponse] = useState<ResponseState | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Handle quit
  useKeyboard((key) => {
    if (key.name === 'q') {
      const cleanExit = (globalThis as any).__mailmanCleanExit;
      if (cleanExit) cleanExit();
    }
  });

  const handleUrlChange = useCallback((url: string) => {
    setRequest((prev) => ({ ...prev, url }));
  }, []);

  const handleMethodChange = useCallback((method: string) => {
    setRequest((prev) => ({ ...prev, method }));
  }, []);

  const handleSend = useCallback(async () => {
    if (!request.url) return;

    setIsLoading(true);
    
    // Mock response for now (will be replaced in Phase 1)
    setTimeout(() => {
      setResponse({
        status: 200,
        statusText: 'OK',
        body: JSON.stringify({ message: 'Hello from mailman!' }, null, 2),
        headers: { 'content-type': 'application/json' },
        time: 150,
      });
      setIsLoading(false);
    }, 500);
  }, [request.url]);

  return (
    <box
      style={{
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'black',
        padding: 1,
      }}
    >
      {/* Header */}
      <box style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1 }}>
        <text fg="#CC8844" bold>
          Mailman v0.0.1
        </text>
        <text fg="#999999">
          Click panels to focus • Press Q to quit
        </text>
      </box>

      {/* Request Panel (40% height) */}
      <box style={{ flexGrow: 2, flexDirection: 'column' }}>
        <RequestPanel
          focused={isFocused('request')}
          onFocus={() => setFocus('request')}
          url={request.url}
          onUrlChange={handleUrlChange}
          method={request.method}
          onMethodChange={handleMethodChange}
          onSend={handleSend}
        />
      </box>

      {/* Response Panel (60% height) */}
      <box style={{ flexGrow: 3, flexDirection: 'column', marginTop: 1 }}>
        <ResponsePanel
          focused={isFocused('response')}
          onFocus={() => setFocus('response')}
          response={response}
        />
      </box>

      {/* Loading indicator */}
      {isLoading && (
        <box
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            backgroundColor: '#1a1a1a',
            border: true,
            borderColor: '#CC8844',
            padding: 1,
          }}
        >
          <text fg="#CC8844">Loading...</text>
        </box>
      )}
    </box>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `bun test src/App.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/App.tsx src/App.test.tsx
git commit -m "feat: integrate RequestPanel and ResponsePanel with layout"
```

---

## Task 6: Create Directory Structure and Index Files

**Files:**
- Create: `src/hooks/index.ts`
- Create: `src/components/index.ts`

**Step 1: Create hooks index**

```typescript
export { useFocus } from './useFocus';
```

**Step 2: Create components index**

```typescript
export { RequestPanel } from './RequestPanel';
export { ResponsePanel } from './ResponsePanel';
```

**Step 3: Update imports in App.tsx**

Replace:
```typescript
import { useFocus } from './hooks/useFocus';
import { RequestPanel } from './components/RequestPanel';
import { ResponsePanel } from './components/ResponsePanel';
```

With:
```typescript
import { useFocus } from './hooks';
import { RequestPanel, ResponsePanel } from './components';
```

**Step 4: Run linting and tests**

Run: `bun run lint`
Expected: No errors

Run: `bun test`
Expected: All tests pass

**Step 5: Commit**

```bash
git add src/hooks/index.ts src/components/index.ts src/App.tsx
git commit -m "chore: add index files for clean imports"
```

---

## Task 7: Manual Testing

**Step 1: Build the application**

Run: `bun run build`
Expected: Build successful

**Step 2: Run the application**

Run: `bun dev`
Expected: Terminal clears and shows:
```
Mailman v0.0.1                    Click panels to focus • Press Q to quit
┌─────────────────────────────────────────────────────────────────────────┐
│ Request                                                                 │
│ ┌─────┬───────────────────────────────────────────────────────────────┐ │
│ │ GET │ Enter URL...                                                  │ │
│ └─────┴───────────────────────────────────────────────────────────────┘ │
│ ┌──────┐                                                                │
│ │ Send │                                                                │
│ └──────┘                                                                │
└─────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────┐
│ Response                                       No response yet.         │
│                                                                         │
│ No response yet. Send a request to see results.                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Step 3: Test mouse interactions**

- Click on Request panel - border should turn orange (#CC8844)
- Click on Response panel - border should turn orange
- Click "GET" button - should cycle through methods (GET → POST → PUT → DELETE → PATCH → GET)
- Click "Send" button - should show loading indicator then mock response

**Step 4: Test keyboard**

- Press Q - should quit the application

**Step 5: Commit**

```bash
git add .
git commit -m "test: manual testing complete for Phase 0"
```

---

## Task 8: Final Verification and Phase Completion

**Step 1: Run all tests**

Run: `bun test`
Expected: All tests pass

**Step 2: Run linting**

Run: `bun run lint`
Expected: No errors

**Step 3: Run formatting check**

Run: `bun run fmt:check`
Expected: All files formatted correctly

**Step 4: Update TODO.md**

Mark Phase 0 as complete in TODO.md:
```markdown
## Phase 0: Core Architecture (Foundation) ✅ COMPLETE
```

**Step 5: Final commit**

```bash
git add TODO.md
git commit -m "feat: complete Phase 0 - Core Architecture with mouse navigation

- Split-screen layout with RequestPanel and ResponsePanel
- Mouse-first navigation (click to focus)
- Basic HTTP method selector and URL input
- Mock response display
- Focus management hook with tests
- All components tested and linted"
```

---

## Phase 0 Exit Criteria ✅

- [x] App shows two panels
- [x] Click to focus each panel (visual border color change)
- [x] Click URL input to focus
- [x] Click method selector to cycle methods
- [x] Click Send button (shows mock response)
- [x] Press Q to quit
- [x] All unit tests pass
- [x] Linting passes
- [x] Code formatted

---

## Next Phase Preview

**Phase 1: Basic HTTP Client**
- Replace mock response with real HTTP requests
- Implement http-client.ts with Bun fetch()
- Handle network errors
- Display real response data

**Skills to use:**
- @tui-dev for UI components
- @unit-test for test coverage

**Estimated time:** 2-3 hours
