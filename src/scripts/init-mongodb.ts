#!/usr/bin/env tsx

/**
 * MongoDB Initialization Script
 * 
 * This script initializes MongoDB collections and creates necessary indexes
 * for the Company Settings module.
 * 
 * Usage:
 *   npm run init-db
 *   or
 *   npx tsx src/scripts/init-mongodb.ts
 */

// Load environment variables first
require('dotenv').config({ path: '.env.local' })

import { CompanyModel } from '../lib/models/Company'
import { getDatabase } from '../lib/mongodb'

async function initializeMongoDB() {
  console.log('🚀 Initializing MongoDB for Company Settings...')
  
  try {
    // Test database connection
    console.log('📡 Testing database connection...')
    const db = await getDatabase()
    console.log(`✅ Connected to database: ${db.databaseName}`)
    
    // Create indexes for Company collection
    console.log('📊 Creating indexes for companies collection...')
    await CompanyModel.createIndexes()
    console.log('✅ Company indexes created successfully')
    
    // List all indexes to verify
    const collection = await CompanyModel.getCollection()
    const indexes = await collection.listIndexes().toArray()
    
    console.log('📋 Current indexes for companies collection:')
    indexes.forEach((index, i) => {
      console.log(`  ${i + 1}. ${index.name}: ${JSON.stringify(index.key)}`)
    })
    
    console.log('🎉 MongoDB initialization completed successfully!')
    
  } catch (error) {
    console.error('❌ MongoDB initialization failed:', error)
    process.exit(1)
  }
}

// Run the initialization
if (require.main === module) {
  initializeMongoDB()
    .then(() => {
      console.log('✨ All done!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Fatal error:', error)
      process.exit(1)
    })
}

export { initializeMongoDB }