import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Tanpa globals Vitest, cleanup RTL tidak otomatis — bersihkan DOM tiap test
afterEach(() => cleanup());

// jsdom tidak menyediakan IntersectionObserver (dipakai dropdown untuk infinite scroll)
class IntersectionObserverStub {
  observe() { /* no-op */ }
  unobserve() { /* no-op */ }
  disconnect() { /* no-op */ }
}
globalThis.IntersectionObserver = IntersectionObserverStub as unknown as typeof IntersectionObserver;
