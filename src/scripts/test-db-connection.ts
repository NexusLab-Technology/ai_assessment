#!/usr/bin/env node

/**
 * Test script to verify MongoDB connection
 * Run with: npx ts-node src/scripts/test-db-connection.ts
 */

import { checkDatabaseHealth, initializeDatabase } from '../lib/db-init.js'

async function testConnection() {
  console.log('Testing MongoDB connection...')
  
  try {
    // Test basic connection
    const health = await checkDatabaseHealth()
    
    if (!health.connected) {
      console.error('❌ Database connection failed:', health.error)
      process.exit(1)
    }
    
    console.log('✅ Database connection successful')
    
    // Initialize database (create indexes)
    await initializeDatabase()
    console.log('✅ Database initialization complete')
    
    console.log('\n🎉 MongoDB setup is ready!')
    console.log('You can now start using the API endpoints.')
    
  } catch (error) {
    console.error('❌ Database setup failed:', error)
    process.exit(1)
  } finally {
    // Close the connection
    process.exit(0)
  }
}

// Run the test
testConnection()