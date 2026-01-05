const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Custom config for API tests that need Node environment
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.api.js'],
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // Transform MongoDB and BSON modules
  transformIgnorePatterns: [
    'node_modules/(?!(mongodb|bson|mongodb-memory-server)/)'
  ],
  // Only run API tests
  testMatch: [
    '<rootDir>/src/__tests__/api/**/*.test.{js,jsx,ts,tsx}'
  ],
  // Use node environment options
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
  // Increase timeout for database operations
  testTimeout: 60000,
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)