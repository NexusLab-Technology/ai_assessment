/**
 * MongoDB Initialization Script (JavaScript version)
 * 
 * This script initializes MongoDB collections and creates necessary indexes
 * for the Company Settings module.
 */

const { MongoClient } = require('mongodb')

async function initializeMongoDB() {
  console.log('🚀 Initializing MongoDB for Company Settings...')
  
  const uri = process.env.MONGODB_URI
  const dbName = process.env.MONGODB_DB || 'ai_assessment'
  
  if (!uri) {
    console.error('❌ MONGODB_URI environment variable is not set')
    process.exit(1)
  }
  
  console.log('📡 Connecting to MongoDB...')
  console.log('URI:', uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')) // Hide credentials
  console.log('Database:', dbName)
  
  const client = new MongoClient(uri)
  
  try {
    await client.connect()
    console.log('✅ Connected to MongoDB successfully')
    
    const db = client.db(dbName)
    const collection = db.collection('companies')
    
    console.log('📊 Creating indexes for companies collection...')
    
    // Create indexes
    await collection.createIndex({ userId: 1 })
    console.log('  ✅ Created index: { userId: 1 }')
    
    await collection.createIndex({ userId: 1, createdAt: -1 })
    console.log('  ✅ Created index: { userId: 1, createdAt: -1 }')
    
    await collection.createIndex({ 
      name: 'text', 
      description: 'text' 
    })
    console.log('  ✅ Created text index: { name: "text", description: "text" }')
    
    // List all indexes to verify
    const indexes = await collection.listIndexes().toArray()
    
    console.log('📋 Current indexes for companies collection:')
    indexes.forEach((index, i) => {
      console.log(`  ${i + 1}. ${index.name}: ${JSON.stringify(index.key)}`)
    })
    
    console.log('🎉 MongoDB initialization completed successfully!')
    
  } catch (error) {
    console.error('❌ MongoDB initialization failed:', error.message)
    process.exit(1)
  } finally {
    await client.close()
    console.log('📡 Database connection closed')
  }
}

// Run the initialization
initializeMongoDB()
  .then(() => {
    console.log('✨ All done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error)
    process.exit(1)
  })