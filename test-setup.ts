import { Window, GlobalWindow } from 'happy-dom';

const window = new GlobalWindow() as unknown as Window & typeof globalThis;

globalThis.document = window.document as unknown as Document;
globalThis.window = window;

// Set up React environment
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

// Mock requestAnimationFrame
globalThis.requestAnimationFrame = (callback: FrameRequestCallback) => {
  return setTimeout(callback, 0) as unknown as number;
};

globalThis.cancelAnimationFrame = (id: number) => {
  clearTimeout(id);
};
