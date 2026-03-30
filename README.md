# Mailman

A terminal-based HTTP client built with Bun and OpenTUI.

![mailman.png](mailman.png)

## Features

- **Interactive TUI**: Full terminal user interface with mouse and keyboard support
- **HTTP Methods**: Support for GET, POST, PUT, DELETE, PATCH
- **Request Components**:
  - Headers editor with common presets
  - Request body editor with content type selection
  - Query parameter builder with URL preview
  - **Authentication**: Bearer token and API key (header or query)
- **Response Viewer**: Syntax-highlighted JSON, XML, HTML with raw view
- **Method Badges**: Color-coded HTTP methods for easy identification
- **Keyboard Shortcuts**: Efficient navigation without mouse

## Quick Start

```bash
# Install dependencies
bun install

# Run in development mode
bun dev

# Or run directly
bun start
```

## Usage

### Navigation

- **Click** on panels to focus
- **Tab** key to switch between response tabs
- **Space** to expand response in full-screen modal
- **Escape** to close modals

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Tab` | Switch response view (Body/Headers/Raw) |
| `Space` | Expand response to full screen |
| `Escape` | Close modal / Go back |
| `Ctrl+Q` | Quit application |

### Request Panel

1. **Method**: Click the method badge to cycle through HTTP methods
2. **URL**: Type the request URL
3. **Tabs**:
   - **Headers**: Add/edit request headers with preset suggestions
   - **Body**: Edit request body (shown for POST/PUT/PATCH)
   - **Query**: Build query parameters with live URL preview
   - **Auth**: Configure authentication (None, Bearer Token, or API Key)

Each tab shows a ● indicator when it contains data.

### Authentication

Three authentication modes are supported:

1. **No Auth**: Send requests without authentication
2. **Bearer Token**: Add `Authorization: Bearer <token>` header
3. **API Key**: 
   - Header: Add custom header (e.g., `X-API-Key: <value>`)
   - Query: Append to URL (e.g., `?api_key=<value>`)

### Response Panel

- **Status Code**: Color-coded (green=2xx, yellow=3xx, orange=4xx, red=5xx)
- **Response Time**: Displayed in milliseconds
- **Content Size**: Human-readable size (B, KB, MB)
- **Tabs**:
  - **Body**: Syntax-highlighted content (JSON, XML, HTML)
  - **Headers**: Response headers list
  - **Raw**: Plain text view

## Development

```bash
# Install dependencies
bun install

# Run in development mode
bun dev

# Format code
bun run fmt

# Check formatting
bun run fmt:check

# Lint code
bun run lint

# Run tests
bun test

# Run tests in watch mode
bun test --watch
```

## Architecture

- **Runtime:** Bun
- **UI Framework:** OpenTUI React reconciler
- **Language:** TypeScript with strict mode
- **Testing:** Bun test runner
- **Formatting:** oxfmt
- **Linting:** oxlint

## Project Structure

```
mailman/
├── src/                  # Source code
│   ├── components/       # React components
│   │   ├── App.tsx              # Main application component
│   │   ├── RequestPanel.tsx     # Request configuration panel
│   │   ├── ResponsePanel.tsx    # Response display panel
│   │   ├── HeadersEditor.tsx    # Headers editor modal
│   │   ├── BodyEditor.tsx       # Body editor modal
│   │   ├── QueryParamsEditor.tsx # Query params builder
│   │   ├── AuthEditor.tsx       # Authentication editor
│   │   ├── HeadersDisplay.tsx   # Response headers display
│   │   ├── SyntaxHighlighter.tsx # Code syntax highlighting
│   │   └── Modal.tsx            # Reusable modal component
│   ├── services/         # Business logic
│   │   └── http-client.ts       # HTTP request handling
│   ├── hooks/            # Custom React hooks
│   │   └── useFocus.ts          # Focus management
│   ├── theme/            # Theming
│   │   └── colors.ts            # Color palette
│   ├── types.ts          # TypeScript type definitions
│   └── utils/            # Utility functions
│       └── response-formatter.ts
├── index.tsx             # Entry point
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── AGENTS.md             # Agent guidelines
```

## Color Theme

Mailman uses a dark purple-accented theme:

- **Backgrounds**: Deep dark grays (#1a1a1e, #141418, #111114)
- **Accent**: Purple (#3C3489) for buttons and active elements
- **Text**: Warm off-white (#c9c7be) with muted variants
- **Method Badges**: Color-coded by HTTP method
  - GET: Green (#7db87d)
  - POST: Yellow (#c9a060)
  - PUT: Blue (#6094c0)
  - DELETE: Red (#d47070)
  - PATCH: Purple (#8a7ed4)
- **Status Codes**: Success/error colors matching syntax highlighting

## License

MIT
