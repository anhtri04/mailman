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

## Current Status

**Current Phase:** Phase 3 - Response Formatting

**Completed Phases:**
- ✅ Phase 0: Core Architecture (Foundation)
- ✅ Phase 1: Basic HTTP Client
- ✅ Phase 2: Request Configuration

**Next Action:** Create implementation plan for Phase 3
