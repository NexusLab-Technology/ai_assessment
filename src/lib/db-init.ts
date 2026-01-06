import { getDatabase } from './mongodb'
import {
  COLLECTIONS,
  ASSESSMENT_INDEXES,
  REPORT_REQUEST_INDEXES,
  REPORT_INDEXES,
  COMPANY_INDEXES
} from './models/assessment'

/**
 * Initialize MongoDB database with collections and indexes
 */
export async function initializeDatabase() {
  try {
    const db = await getDatabase()
    
    console.log('🔄 Initializing AI Assessment database...')
    
    // Create collections if they don't exist
    const collections = await db.listCollections().toArray()
    const existingCollectionNames = collections.map(c => c.name)
    
    for (const collectionName of Object.values(COLLECTIONS)) {
      if (!existingCollectionNames.includes(collectionName)) {
        await db.createCollection(collectionName)
        console.log(`✅ Created collection: ${collectionName}`)
      } else {
        console.log(`ℹ️  Collection already exists: ${collectionName}`)
      }
    }
    
    // Create indexes for assessments collection
    const assessmentsCollection = db.collection(COLLECTIONS.ASSESSMENTS)
    for (const index of ASSESSMENT_INDEXES) {
      try {
        await assessmentsCollection.createIndex(index.key, { 
          name: index.name,
          background: true 
        })
        console.log(`✅ Created index: ${COLLECTIONS.ASSESSMENTS}.${index.name}`)
      } catch (error: any) {
        if (error.code === 85) { // Index already exists
          console.log(`ℹ️  Index already exists: ${COLLECTIONS.ASSESSMENTS}.${index.name}`)
        } else {
          console.error(`❌ Error creating index ${index.name}:`, error.message)
        }
      }
    }
    
    // Create indexes for report_requests collection
    const reportRequestsCollection = db.collection(COLLECTIONS.REPORT_REQUESTS)
    for (const index of REPORT_REQUEST_INDEXES) {
      try {
        const options: any = { 
          name: index.name,
          background: true 
        }
        if ('sparse' in index) {
          options.sparse = index.sparse
        }
        
        await reportRequestsCollection.createIndex(index.key, options)
        console.log(`✅ Created index: ${COLLECTIONS.REPORT_REQUESTS}.${index.name}`)
      } catch (error: any) {
        if (error.code === 85) { // Index already exists
          console.log(`ℹ️  Index already exists: ${COLLECTIONS.REPORT_REQUESTS}.${index.name}`)
        } else {
          console.error(`❌ Error creating index ${index.name}:`, error.message)
        }
      }
    }
    
    // Create indexes for reports collection
    const reportsCollection = db.collection(COLLECTIONS.REPORTS)
    for (const index of REPORT_INDEXES) {
      try {
        const options: any = { 
          name: index.name,
          background: true 
        }
        if ('unique' in index) {
          options.unique = index.unique
        }
        
        await reportsCollection.createIndex(index.key, options)
        console.log(`✅ Created index: ${COLLECTIONS.REPORTS}.${index.name}`)
      } catch (error: any) {
        if (error.code === 85) { // Index already exists
          console.log(`ℹ️  Index already exists: ${COLLECTIONS.REPORTS}.${index.name}`)
        } else {
          console.error(`❌ Error creating index ${index.name}:`, error.message)
        }
      }
    }
    
    // Create indexes for companies collection
    const companiesCollection = db.collection(COLLECTIONS.COMPANIES)
    for (const index of COMPANY_INDEXES) {
      try {
        const options: any = { 
          name: index.name,
          background: true 
        }
        if ('unique' in index) {
          options.unique = index.unique
        }
        
        await companiesCollection.createIndex(index.key, options)
        console.log(`✅ Created index: ${COLLECTIONS.COMPANIES}.${index.name}`)
      } catch (error: any) {
        if (error.code === 85) { // Index already exists
          console.log(`ℹ️  Index already exists: ${COLLECTIONS.COMPANIES}.${index.name}`)
        } else {
          console.error(`❌ Error creating index ${index.name}:`, error.message)
        }
      }
    }
    
    console.log('🎉 Database initialization completed successfully!')
    
    return {
      success: true,
      message: 'Database initialized successfully'
    }
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    return {
      success: false,
      message: `Database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Check database connection and collections
 */
export async function checkDatabaseHealth() {
  try {
    const db = await getDatabase()
    
    // Test connection
    await db.admin().ping()
    
    // Check collections
    const collections = await db.listCollections().toArray()
    const collectionNames = collections.map(c => c.name)
    
    const requiredCollections = Object.values(COLLECTIONS)
    const missingCollections = requiredCollections.filter(
      name => !collectionNames.includes(name)
    )
    
    return {
      connected: true,
      database: db.databaseName,
      collections: collectionNames,
      missingCollections,
      healthy: missingCollections.length === 0
    }
    
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      healthy: false
    }
  }
}