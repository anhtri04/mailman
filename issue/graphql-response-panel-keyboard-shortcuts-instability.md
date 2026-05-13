# GraphQL Response Panel Keyboard Shortcuts Instability

## Context

Issue observed in GraphQL response UX (`src/components/GraphQLResponsePanel.tsx`):

1. `Tab` (switch response tabs) is intermittently ignored.
2. `Space` (expand response) is intermittently ignored.
3. Behavior appears inconsistent when panel is visually focused.
4. When a modal is opened/closed, shortcuts often work again temporarily.

## Environment

- App: Mailman TUI
- Runtime: Bun + OpenTUI (`@opentui/react`)
- Affected component: `src/components/GraphQLResponsePanel.tsx:66`
- Similar implementation also present in: `src/components/ResponsePanel.tsx:51`

## Reproduction Scenarios

### Scenario A: Space ignored after response state changes

1. Open a GraphQL request with response panel mounted.
2. Focus response panel.
3. Send request and wait for response update.
4. Press `Space`.

Expected:

- Response expands.

Actual (intermittent):

- No action.

### Scenario B: Tab cycling uses stale tab state

1. With response visible, focus response panel.
2. Click `Headers` tab with mouse.
3. Press `Tab`.

Expected:

- Active tab advances to next tab.

Actual (intermittent):

- No action, or inconsistent tab transition.

### Scenario C: Tab click does not transfer focus owner

1. Click tab button (`Body`/`Headers`/`Raw`/`Errors`).
2. Immediately press `Tab`.

Expected:

- Response panel handles `Tab` shortcut.

Actual (intermittent):

- Shortcut ignored because focus can remain on prior area.

### Scenario D: Modal interaction temporarily restores behavior

1. Reproduce non-responsive shortcut state.
2. Open any modal and close it.
3. Retry `Tab`/`Space` in response panel.

Observed:

- Shortcuts often work again for some period.

## Root Causes Identified

### 1) Stale closure in keyboard handler (primary)

- `useKeyboard` callback in `GraphQLResponsePanel` captures `focused`, `response`, `isExpanded`, `activeTab` from a prior render.
- If listener registration is not refreshed on each state change, key handler reads outdated values.
- This directly explains intermittent silent behavior when state has changed since registration.

Relevant code:

- `src/components/GraphQLResponsePanel.tsx:66-79`
- `src/components/ResponsePanel.tsx:51-65` (same pattern)

### 2) Focus propagation blocked on tab buttons (secondary)

- Tab button click handler calls `stopPropagation()` and only updates local `activeTab`.
- Parent panel `onMouseDown={onFocus}` does not fire when click is stopped.
- User can click a tab and still not have response panel as global focus owner.

Relevant code:

- `src/components/GraphQLResponsePanel.tsx:82-85`
- Parent focus handler at `src/components/GraphQLResponsePanel.tsx:138`

## Why Modal Appears to Fix It

- Modal mount/unmount changes global keyboard/focus handling lifecycle.
- This likely causes keyboard listeners to be re-registered with fresh closure values, making shortcuts appear healthy again.

## Impact

- Core keyboard UX for response navigation is unreliable.
- Affects accessibility and power-user workflows.
- Can produce confusing state where panel looks focused but shortcut ownership differs.

## Suggested Fix Direction

1. Stabilize `useKeyboard` state reads:
   - Use refs for latest `focused`, `response`, `isExpanded`, `activeTab` inside keyboard callback, or
   - Ensure hook registration updates with current state (if supported by OpenTUI API pattern).
2. Ensure tab click sets response focus owner explicitly:
   - Call `onFocus()` in tab click path (before/after `stopPropagation()`), or
   - Remove propagation block if safe.
3. Apply same fix pattern to `ResponsePanel` to avoid mirrored bug in REST response view.

## Manual Verification Checklist (Post-Fix)

1. Click panel background, press `Tab` repeatedly (cycles all tabs reliably).
2. Click each tab button, then press `Tab` (still cycles reliably).
3. Press `Space` before and after response updates (always expands when eligible).
4. Expand/collapse with `Space`/`Escape` repeatedly (no dead key windows).
5. Open/close modals and retest shortcuts (no behavior drift).
