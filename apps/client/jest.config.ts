/* eslint-disable */
export default {
  displayName: 'client',
  preset: '../../jest.preset.js',
  // RTL needs a browser-like DOM.
  testEnvironment: 'jsdom',
  // Extends expect() with jest-dom matchers (toBeInTheDocument, toHaveAccessibleName, ...)
  // and registers jest-axe. See jest.setup.ts.
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
    '^.+\\.[tj]sx?$': ['babel-jest', { presets: ['@nx/next/babel'] }],
  },
  moduleNameMapper: {
    // Stub out stylesheets (global.css, *.module.css, etc.) so imports don't crash jsdom.
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // Stub static asset imports.
    '\\.(jpg|jpeg|png|gif|webp|avif|svg|ico)$':
      '<rootDir>/__mocks__/fileMock.js',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  // E2E specs live in apps/client/e2e and are run by Playwright, not Jest.
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/e2e/'],
  coverageDirectory: '../../coverage/apps/client',
};
