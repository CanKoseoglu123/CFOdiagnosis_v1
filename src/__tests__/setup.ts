// Global test setup for Vitest
// Ensure deterministic environment for scoring tests

import { vi } from 'vitest';

// Suppress console.log in tests unless DEBUG is set
if (!process.env.DEBUG) {
  vi.spyOn(console, 'log').mockImplementation(() => {});
}
