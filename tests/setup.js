/**
 * Vitest global test setup
 * Runs before every test file. Configures jsdom browser-API stubs
 * so pure-utility functions that touch localStorage, clipboard, etc. work in Node.
 */

// Stub localStorage / sessionStorage (jsdom provides these but reset between tests)
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

// Stub navigator.clipboard (not available in jsdom by default)
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(''),
  },
  writable: true,
  configurable: true,
});

// Stub speechSynthesis
Object.defineProperty(window, 'speechSynthesis', {
  value: {
    cancel: vi.fn(),
    speak: vi.fn(),
    getVoices: vi.fn(() => []),
  },
  writable: true,
  configurable: true,
});
