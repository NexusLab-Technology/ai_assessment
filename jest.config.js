const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // Transform MongoDB and BSON modules
  transformIgnorePatterns: [
    'node_modules/(?!(mongodb|bson|mongodb-memory-server)/)'
  ],
  // Use different test environments based on test file patterns
  projects: [
    {
      displayName: 'jsdom',
      testEnvironment: 'jsdom',
      testMatch: [
        '<rootDir>/src/__tests__/components/**/*.test.{js,jsx,ts,tsx}',
        '<rootDir>/src/__tests__/hooks/**/*.test.{js,jsx,ts,tsx}',
        '<rootDir>/src/__tests__/types/**/*.test.{js,jsx,ts,tsx}',
        '<rootDir>/src/__tests__/validation/**/*.test.{js,jsx,ts,tsx}',
        '<rootDir>/src/__tests__/integration/**/*.test.{js,jsx,ts,tsx}'
      ],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
    },
    {
      displayName: 'node',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/src/__tests__/api/**/*.test.{js,jsx,ts,tsx}',
        '<rootDir>/src/__tests__/lib/**/*.test.{js,jsx,ts,tsx}'
      ],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.api.js'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      transformIgnorePatterns: [
        'node_modules/(?!(mongodb|bson|mongodb-memory-server)/)'
      ],
      testEnvironmentOptions: {
        customExportConditions: ['node', 'node-addons'],
      },
    }
  ]
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)