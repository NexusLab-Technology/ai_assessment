// Setup for API tests - no DOM testing libraries needed
// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

// Set up environment variables for testing
if (!process.env.MONGODB_URI) {
  process.env.MONGODB_URI = 'mongodb://localhost:27017/test'
}
if (!process.env.MONGODB_DB) {
  process.env.MONGODB_DB = 'test-ai-assessment'
}
process.env.NODE_ENV = 'test'

// Add any API-specific test setup here