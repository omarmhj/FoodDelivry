// Global test setup for the customer-app (client) Jest + RTL harness.
import '@testing-library/jest-dom';
import { toHaveNoViolations } from 'jest-axe';
import { cleanup } from '@testing-library/react';

// Enable `expect(results).toHaveNoViolations()` for accessibility assertions.
expect.extend(toHaveNoViolations);

// RTL auto-cleanup between tests (belt-and-braces; RTL v14 also does this).
afterEach(() => {
  cleanup();
});

// jsdom does not implement matchMedia; many responsive/UI libs (NextUI, next-themes)
// read it. Provide a controllable mock so responsive tests can drive breakpoints.
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }),
  });
}

// jsdom lacks IntersectionObserver / ResizeObserver used by carousels & skeletons.
if (typeof window !== 'undefined') {
  // @ts-expect-error partial mock is sufficient for tests
  window.IntersectionObserver =
    window.IntersectionObserver ||
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    };
  // @ts-expect-error partial mock is sufficient for tests
  window.ResizeObserver =
    window.ResizeObserver ||
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
}
