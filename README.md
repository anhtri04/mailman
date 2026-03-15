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
