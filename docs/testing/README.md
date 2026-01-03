# Testing Documentation

Comprehensive testing strategies and utilities for the Configurable Authentication Framework.

## Testing Philosophy

The framework uses a multi-layered testing approach:

1. **Property-Based Testing** - Universal correctness properties using fast-check
2. **Unit Testing** - Individual component and function testing
3. **Integration Testing** - End-to-end authentication flows
4. **SSR Testing** - Server-side rendering consistency
5. **Non-Interference Testing** - External system isolation validation

## Testing Structure

### Property Tests

Property tests validate universal correctness properties that should hold for all valid inputs:

- [**Authentication Properties**](./property-tests/authentication.md) - Core authentication behavior
- [**Session Properties**](./property-tests/session.md) - Session management consistency
- [**UI Properties**](./property-tests/ui.md) - UI rendering and state consistency
- [**SSR Properties**](./property-tests/ssr.md) - Server-side rendering consistency
- [**External System Properties**](./property-tests/external.md) - Non-interference guarantees

### Unit Tests

Unit tests validate specific components and functions:

- [**Component Tests**](./unit-tests/components.md) - React component testing
- [**Hook Tests**](./unit-tests/hooks.md) - Custom hook testing
- [**Utility Tests**](./unit-tests/utilities.md) - Utility function testing
- [**Context Tests**](./unit-tests/contexts.md) - React context testing

### Integration Tests

Integration tests validate complete workflows:

- [**Authentication Flow Tests**](./integration-tests/auth-flow.md) - Complete login/logout flows
- [**Route Protection Tests**](./integration-tests/route-protection.md) - Route guarding behavior
- [**Sidebar Tests**](./integration-tests/sidebar.md) - Navigation and sidebar integration
- [**Configuration Tests**](./integration-tests/configuration.md) - Environment configuration switching

## Test Utilities

### Testing Helpers

```tsx
// Authentication test helpers
import { createMockAuthProvider, createMockUser } from '@/test-utils/auth';

// Component test helpers
import { renderWithAuth, renderWithoutAuth } from '@/test-utils/render';

// Property test generators
import { authConfigArbitrary, userArbitrary } from '@/test-utils/arbitraries';
```

### Mock Implementations

- [**MockAuthProvider**](./mocks/MockAuthProvider.md) - Mock authentication provider
- [**MockExternalAuth**](./mocks/MockExternalAuth.md) - Mock external authentication system
- [**MockConfigManager**](./mocks/MockConfigManager.md) - Mock configuration manager

### Test Fixtures

- [**User Fixtures**](./fixtures/users.md) - Test user data
- [**Session Fixtures**](./fixtures/sessions.md) - Test session data
- [**Configuration Fixtures**](./fixtures/configs.md) - Test configuration data

## Running Tests

### All Tests
```bash
npm test
```

### Property Tests Only
```bash
npm test -- --testNamePattern="Property"
```

### Unit Tests Only
```bash
npm test -- --testPathPattern="__tests__" --testNamePattern="^(?!.*Property).*"
```

### Integration Tests Only
```bash
npm test -- --testPathPattern="integration"
```

### Coverage Report
```bash
npm run test:coverage
```

## Test Configuration

### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: [
    '**/__tests__/**/*.test.{js,jsx,ts,tsx}',
    '**/*.test.{js,jsx,ts,tsx}'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test-utils/**/*'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### Test Setup

```javascript
// jest.setup.js
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

configure({ testIdAttribute: 'data-testid' });

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/',
}));
```

## Property Testing with fast-check

### Basic Property Test Structure

```tsx
import * as fc from 'fast-check';

describe('Authentication Properties', () => {
  it('should maintain authentication state consistency', () => {
    fc.assert(
      fc.property(
        fc.record({
          authEnabled: fc.boolean(),
          isAuthenticated: fc.boolean(),
          user: fc.option(userArbitrary),
        }),
        (testConfig) => {
          // Property assertion logic
          expect(/* property condition */).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Custom Arbitraries

```tsx
// User arbitrary
export const userArbitrary = fc.record({
  id: fc.string(),
  username: fc.string(),
  email: fc.emailAddress(),
  roles: fc.array(fc.string()),
  lastLogin: fc.date(),
});

// Auth config arbitrary
export const authConfigArbitrary = fc.record({
  authEnabled: fc.boolean(),
  sessionTimeout: fc.integer({ min: 60000, max: 86400000 }),
  rememberSidebar: fc.boolean(),
});
```

## Testing Best Practices

### 1. Test Isolation
- Each test should be independent
- Clean up state between tests
- Use proper mocking for external dependencies

### 2. Property Test Design
- Focus on invariants that should always hold
- Use meaningful property names
- Include edge cases in generators

### 3. Component Testing
- Test user interactions, not implementation details
- Use semantic queries (getByRole, getByLabelText)
- Test accessibility features

### 4. Integration Testing
- Test complete user workflows
- Include error scenarios
- Validate external system interactions

### 5. Performance Testing
- Test with large datasets
- Validate memory usage
- Check for performance regressions

## Continuous Integration

### GitHub Actions

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v3
```

## Debugging Tests

### Common Issues
- [**Mock Issues**](./debugging/mocks.md) - Common mocking problems
- [**Async Issues**](./debugging/async.md) - Handling asynchronous operations
- [**Context Issues**](./debugging/context.md) - React context testing problems
- [**Property Test Issues**](./debugging/property-tests.md) - Property test debugging

### Debugging Tools
- React Developer Tools
- Jest debugging with VS Code
- fast-check verbose mode
- Console logging strategies