// Test setup file for Vitest
import { beforeEach, vi } from 'vitest';

// Mock window.history for tests
beforeEach(() => {
  Object.defineProperty(window, 'history', {
    value: {
      pushState: vi.fn(),
      replaceState: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      go: vi.fn()
    },
    writable: true
  });

  Object.defineProperty(window, 'location', {
    value: {
      pathname: '/',
      search: '',
      hash: '',
      href: 'http://localhost:3000/'
    },
    writable: true
  });
});