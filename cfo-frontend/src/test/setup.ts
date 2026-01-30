import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Automatic cleanup after each test
afterEach(() => {
  cleanup();
});
