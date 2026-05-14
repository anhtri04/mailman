#!/usr/bin/env bun

import { createCliRenderer } from '@opentui/core';
import { createRoot } from '@opentui/react';
import { App } from './src/App';
import { CliApp } from './src/cli';
import { ThemeProvider } from './src/theme/ThemeProvider';

const modeArg = process.argv[2]?.toLowerCase();
const isCliMode = modeArg === 'cli';

// Create the CLI renderer (async)
const renderer = await createCliRenderer({
  exitOnCtrlC: false, // We handle Ctrl+C in the app
  useAlternateScreen: true, // Enable fullscreen mode with alternate buffer
});

// Create and mount the React root
const root = createRoot(renderer);
root.render(<ThemeProvider>{isCliMode ? <CliApp /> : <App />}</ThemeProvider>);

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
