// Setup for API tests - no DOM testing libraries needed
// Set up environment variables for testing
process.env.MONGODB_URI = 'mongodb://localhost:27017/test'
process.env.MONGODB_DB = 'test-ai-assessment'
process.env.NODE_ENV = 'test'

// Add any API-specific test setup here