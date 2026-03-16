# Mailman - Development Roadmap

A terminal-based HTTP client built with Bun and OpenTUI.

## Phase 0: Core Architecture (Foundation) ✅ COMPLETE
**Goal:** Establish the basic UI layout and navigation system

- [x] Split-screen layout (Request panel / Response panel)
  - [x] Create RequestPanel component (40% height)
  - [x] Create ResponsePanel component (60% height)
  - [x] Implement flexbox layout in App.tsx
  - [x] Add borders and visual separation
  
- [x] **Mouse-first navigation system** (Primary)
  - [x] Click panels to focus (Request/Response)
  - [x] Click tabs to switch between tabs
  - [x] Click buttons to activate (Send, Save, etc.)
  - [x] Click input fields to focus and edit
  - [x] Hover states (cursor changes on interactive elements)
  - [x] Visual focus indicators (border colors)
  
- [x] **Keyboard navigation** (Secondary for power users)
  - [x] Tab/Shift+Tab to cycle between panels
  - [x] Arrow keys for navigation in lists
  - [x] Enter to activate buttons/selections
  - [x] Escape to close modals
  
- [x] Basic input components
  - [x] URLInput component with click-to-focus
  - [x] MethodSelector dropdown with click selection
  - [x] Send button with onMouseDown handler
  
- [x] Testing
  - [x] Unit tests for layout components
  - [x] Mouse interaction tests
  - [x] Manual testing: click around all interactive elements

**Exit Criteria:** App shows two panels, click to focus each panel, click URL input to type, click Send button ✅

---

## Phase 1: Basic HTTP Client ✅ COMPLETE
**Goal:** Make actual HTTP requests

- [x] HTTP service module
  - [x] Create src/services/http-client.ts
  - [x] Implement sendRequest() with Bun fetch()
  - [x] Support GET, POST, PUT, DELETE, PATCH methods
  - [x] Handle request timeout (default 30s)
  - [x] Return structured response object
  
- [x] Response handling
  - [x] Display response status code
  - [x] Display response body (raw text)
  - [x] Display response time
  - [x] Handle empty responses
  
- [x] Error handling
  - [x] Network error detection
  - [x] Display user-friendly error messages
  - [x] Handle DNS failures
  - [x] Handle connection timeouts
  
- [x] Testing
  - [x] Unit tests for HTTP client (mock fetch)
  - [x] Error handling tests
  - [x] Manual testing: make requests to httpbin.org

**Exit Criteria:** Can make GET request to httpbin.org/get and see response ✅

---

## Phase 2: Request Configuration ✅ COMPLETE
**Goal:** Full request customization

- [x] Headers management
  - [x] Create HeadersEditor component
  - [x] Key-value input pairs
  - [x] Add/remove header buttons
  - [x] Common headers presets (Content-Type, Authorization)
  - [x] Modal popup interface (click Headers tab)
  
- [x] Request body input
  - [x] Create BodyEditor component (textarea)
  - [x] Support raw text input
  - [x] Content-Type header auto-detection
  - [x] Body preview
  - [x] Modal popup interface (click Body tab)
  
- [x] Query parameters
  - [x] Create QueryParamsEditor component
  - [x] Auto-append to URL
  - [x] URL encoding support
  - [x] Display full URL with params
  - [x] Modal popup interface (click Query tab)
  
- [x] Modal system
  - [x] Create reusable Modal component
  - [x] 80% centered modal layout
  - [x] Escape key to close
  - [x] Scrollable content areas
  
- [x] Testing
  - [x] Header parsing and formatting tests
  - [x] URL building with query params tests
  - [x] Body handling tests
  - [x] Manual testing: POST with JSON body and headers

**Exit Criteria:** Can send POST request with custom headers and JSON body ✅

---

## Phase 3: Response Formatting
**Goal:** Make responses readable

- [ ] JSON formatting
  - [ ] Create JSONFormatter utility
  - [ ] Pretty-print with indentation (2 spaces)
  - [ ] Handle invalid JSON gracefully
  - [ ] Syntax highlighting (basic colors)
  
- [ ] Response metadata display
  - [ ] Status code with color coding (2xx green, 4xx yellow, 5xx red)
  - [ ] Status text
  - [ ] Response time in ms
  - [ ] Response size (bytes)
  - [ ] Content-Type header display
  
- [ ] Response tabs
  - [ ] Body tab (formatted content)
  - [ ] Headers tab (response headers)
  - [ ] Tab switching with arrow keys
  
- [ ] Testing
  - [ ] JSON formatting unit tests
  - [ ] Response parsing tests
  - [ ] Manual testing: view formatted JSON response

**Exit Criteria:** JSON responses are pretty-printed with colors

---

## Phase 4: Request History
**Goal:** Track and reuse requests

- [ ] History storage module
  - [ ] Create src/utils/history-storage.ts
  - [ ] Define HistoryEntry interface
  - [ ] Implement saveHistoryEntry()
  - [ ] Implement loadHistory()
  - [ ] Auto-limit to 100 entries
  - [ ] Persist to ~/.mailman/history.json
  
- [ ] History viewer component
  - [ ] Create HistoryViewer modal
  - [ ] List last N requests (newest first)
  - [ ] Display: method, URL, timestamp, status
  - [ ] **Mouse: Click to select and load request**
  - [ ] **Mouse: Click X button to delete entry**
  - [ ] Keyboard: Up/down arrows to navigate
  - [ ] Keyboard: Enter to load, D to delete
  - [ ] Open with H key or menu click
  
- [ ] Auto-save requests
  - [ ] Save on successful send
  - [ ] Include: method, URL, headers, body, timestamp, response status
  - [ ] Prevent duplicate consecutive entries
  
- [ ] Testing
  - [ ] History storage unit tests
  - [ ] History viewer component tests
  - [ ] Manual testing: make requests, view history, reload request

**Exit Criteria:** Press H to see history, select and re-execute previous request

---

## Phase 5: Saved Requests
**Goal:** Curated request collection

- [ ] Saved requests storage
  - [ ] Create src/utils/saved-requests-storage.ts
  - [ ] Define SavedRequest interface (with name field)
  - [ ] Implement saveRequest(name, request)
  - [ ] Implement loadSavedRequests()
  - [ ] Implement deleteSavedRequest(id)
  - [ ] Persist to ~/.mailman/saved.json
  
- [ ] Save functionality
  - [ ] Save modal (prompt for name)
  - [ ] S key shortcut to save
  - [ ] Validate name is unique
  - [ ] Auto-generate name from URL if blank
  
- [ ] Saved requests viewer
  - [ ] Create SavedRequestsModal
  - [ ] List all saved requests
  - [ ] Search/filter by name
  - [ ] **Mouse: Click to load request**
  - [ ] **Mouse: Click delete button to remove**
  - [ ] Keyboard: Arrow keys to navigate
  - [ ] Keyboard: Enter to load, D to delete
  - [ ] Open with L key or menu click
  
- [ ] Testing
  - [ ] Saved requests storage unit tests
  - [ ] Save/load flow tests
  - [ ] Manual testing: save request, restart app, load request

**Exit Criteria:** Can save named requests and load them after restart

---

## Phase 6: Environment Variables
**Goal:** Variable substitution system

- [ ] Variable substitution engine
  - [ ] Create src/utils/variable-substitution.ts
  - [ ] Implement substituteVariables(text, variables)
  - [ ] Support {{VARIABLE_NAME}} syntax
  - [ ] Keep placeholder if variable not found
  - [ ] Apply to URL, headers, and body
  
- [ ] Environment storage
  - [ ] Create src/utils/environment-storage.ts
  - [ ] Define Environment interface
  - [ ] Support multiple environments (dev, staging, prod)
  - [ ] Key-value variable storage
  - [ ] Persist to ~/.mailman/environments.json
  - [ ] Set default environment
  
- [ ] Environment selector
  - [ ] Display current environment name in UI
  - [ ] E key to open environment switcher
  - [ ] List available environments
  - [ ] Show variable count per environment
  
- [ ] Environment editor
  - [ ] Create EnvironmentEditor modal
  - [ ] Add/remove environments
  - [ ] Add/edit/delete variables
  - [ ] Import/export environment files
  
- [ ] Testing
  - [ ] Variable substitution unit tests
  - [ ] Edge cases: nested variables, empty values
  - [ ] Manual testing: create env, use variables in request

**Exit Criteria:** Create {{BASE_URL}} variable, use in request, switch environments

---

## Phase 7: Authentication
**Goal:** API authentication support

- [ ] Bearer token auth
  - [ ] Add Auth tab to RequestPanel
  - [ ] Token input field
  - [ ] Auto-add Authorization header
  - [ ] Mask token in UI (show last 4 chars)
  
- [ ] Basic auth
  - [ ] Username/password inputs
  - [ ] Base64 encoding
  - [ ] Auto-generate Authorization header
  
- [ ] API Key auth
  - [ ] Header name input (default: X-API-Key)
  - [ ] API key value input
  - [ ] Auto-add header
  
- [ ] Auth persistence
  - [ ] Option to save auth with request
  - [ ] Warning for saved credentials
  - [ ] Clear auth button
  
- [ ] Testing
  - [ ] Auth header generation tests
  - [ ] Base64 encoding tests
  - [ ] Manual testing: authenticate with real API

**Exit Criteria:** Can add Bearer token and make authenticated request

---

## Phase 8: Polish & UX
**Goal:** Production-ready experience

- [ ] Help system
  - [ ] Create HelpModal component
  - [ ] Display all keyboard shortcuts
  - [ ] ? key to open help
  - [ ] Context-sensitive help (show shortcuts for current focus)
  
- [ ] Toast notifications
  - [ ] Create Toast component
  - [ ] Success/error/info variants
  - [ ] Auto-dismiss after 3 seconds
  - [ ] Show at bottom of screen
  
- [ ] Copy functionality
  - [ ] Copy response body to clipboard
  - [ ] Copy request as cURL command
  - [ ] Keyboard shortcut (Ctrl+C when focused)
  
- [ ] Import/Export
  - [ ] Import from cURL command
  - [ ] Export request to file
  - [ ] Import Postman collection (basic)
  
- [ ] Performance improvements
  - [ ] Handle large response bodies (>1MB)
  - [ ] Truncate display for huge responses
  - [ ] Loading indicator for slow requests
  - [ ] Request cancellation (Ctrl+C during request)
  
- [ ] Testing
  - [ ] Integration tests
  - [ ] Performance tests with large payloads
  - [ ] Manual testing: full user workflows

**Exit Criteria:** Help modal works, can copy responses, smooth UX

---

## Future Enhancements (Post-MVP)

### Advanced Features
- [ ] Request collections/folders
- [ ] Request chaining (extract values from response)
- [ ] WebSocket support
- [ ] GraphQL support
- [ ] Response diff comparison
- [ ] Request scripting (pre/post request scripts)

### UI Improvements
- [ ] Resizable panels (drag to resize)
- [ ] Syntax highlighting for more formats (XML, HTML)
- [ ] Response preview (render HTML)
- [ ] Dark/light theme toggle
- [ ] Custom color schemes

### Developer Experience
- [ ] Plugin system
- [ ] Custom keyboard bindings
- [ ] Configuration file (~/.mailman/config.json)
- [ ] Request templates/snippets
- [ ] CLI arguments (mailman <url>)

### Testing & Quality
- [ ] Integration test suite
- [ ] E2E tests with test server
- [ ] Performance benchmarks
- [ ] Binary releases for all platforms
- [ ] CI/CD pipeline

---

## Development Guidelines

### Before Starting Each Phase
1. Read AGENTS.md for coding standards
2. Review existing code patterns
3. Write implementation plan in docs/plans/
4. Create unit tests first (TDD)

### During Development
1. One feature at a time
2. Write tests as you go
3. Run `bun run fmt` and `bun run lint` regularly
4. Manual test in terminal
5. Commit when phase is complete

### Phase Completion Checklist
- [ ] All features implemented
- [ ] Unit tests pass (`bun test`)
- [ ] Linting passes (`bun run lint`)
- [ ] Code formatted (`bun run fmt`)
- [ ] Manual testing complete
- [ ] Git commit with descriptive message
- [ ] Update this TODO.md (mark phase complete)

### Using Agentic Coding
Each phase should be implemented using the Task tool with appropriate agents:
- **@tui-dev** - For OpenTUI components and UI features
- **@unit-test** - For writing comprehensive tests
- Follow bite-sized tasks (2-5 minutes each)
- Review between tasks
- Never overwhelm the agent with too many requirements

### Mouse Interaction Guidelines
When implementing UI components, always prioritize mouse interaction:

```tsx
// Good - Mouse clickable with visual feedback
<box 
  borderColor={isFocused ? '#CC8844' : '#555555'}
  onMouseDown={() => setFocus('panel')}
>
  <text>Clickable Panel</text>
</box>

// Good - Button with onMouseDown
<box
  backgroundColor="#CC8844"
  onMouseDown={handleSend}
>
  <text>Send</text>
</box>

// Good - List item clickable
<box onMouseDown={() => loadRequest(request)}>
  <text>{request.name}</text>
</box>
```

**Mouse Event Priority:**
1. Use `onMouseDown` for immediate response (not onClick)
2. Show visual hover/focus states
3. Ensure clickable areas are large enough
4. Support keyboard as fallback (Tab, Enter, arrows)

---

## Current Status

**Current Phase:** Phase 0 - Core Architecture (Foundation)

**Completed Phases:** None

**Next Action:** Create implementation plan for Phase 0
