import { getDatabase } from './mongodb'
import {
  COLLECTIONS,
  ASSESSMENT_INDEXES,
  RAPID_QUESTIONNAIRE_INDEXES,
  REPORT_REQUEST_INDEXES,
  REPORT_INDEXES,
  COMPANY_INDEXES
} from '@/lib/models/assessment'
import { RAPIDQuestionnaireService } from './services/rapid-questionnaire-service'

/**
 * Initialize MongoDB database with collections and indexes
 */
export async function initializeDatabase() {
  try {
    const db = await getDatabase()
    
    console.log('🔄 Initializing AI Assessment database...')
    
    // Create collections if they don't exist
    const collections = await db.listCollections().toArray()
    const existingCollectionNames = collections.map(c => (c as any).name as string)
    
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
        await assessmentsCollection.createIndex(index.key as any, { 
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
    
    // Create indexes for rapid_questionnaires collection
    const rapidQuestionnairesCollection = db.collection(COLLECTIONS.RAPID_QUESTIONNAIRES)
    for (const index of RAPID_QUESTIONNAIRE_INDEXES) {
      try {
        const options: any = { 
          name: index.name,
          background: true 
        }
        if ('unique' in index) {
          options.unique = index.unique
        }
        
        await rapidQuestionnairesCollection.createIndex(index.key as any, options)
        console.log(`✅ Created index: ${COLLECTIONS.RAPID_QUESTIONNAIRES}.${index.name}`)
      } catch (error: any) {
        if (error.code === 85) { // Index already exists
          console.log(`ℹ️  Index already exists: ${COLLECTIONS.RAPID_QUESTIONNAIRES}.${index.name}`)
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
        
        await reportRequestsCollection.createIndex(index.key as any, options)
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
        
        await reportsCollection.createIndex(index.key as any, options)
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
    
    // Drop ALL unique indexes on name (temporary - user doesn't want database optimization yet)
    // This allows creating companies without index conflicts
    const indexesToDrop = ['name_userId', 'userId_1', 'userId_1_createdAt_-1', 'name_unique', 'name_unique_active', 'name']
    for (const indexName of indexesToDrop) {
      try {
        await companiesCollection.dropIndex(indexName)
        console.log(`✅ Dropped index: ${COLLECTIONS.COMPANIES}.${indexName}`)
      } catch (error: any) {
        if (error.code === 27) { // IndexNotFound - that's fine
          // Index doesn't exist, skip
        } else {
          console.warn(`⚠️  Could not drop index ${indexName}:`, error.message)
        }
      }
    }
    
    // Create non-unique index on name (for performance only, not uniqueness)
    // Uniqueness will be checked in application code
    try {
      await companiesCollection.createIndex({ name: 1 }, { name: 'name_1', background: true })
      console.log(`✅ Created non-unique index: ${COLLECTIONS.COMPANIES}.name_1 (for performance only)`)
    } catch (error: any) {
      if (error.code === 85) { // Index already exists
        console.log(`ℹ️  Index already exists: ${COLLECTIONS.COMPANIES}.name_1`)
      } else {
        console.warn(`⚠️  Could not create name_1 index:`, error.message)
      }
    }
    
    // Create other indexes (excluding name unique index)
    for (const index of COMPANY_INDEXES) {
      // Skip name unique index - using non-unique index instead
      if (index.name === 'name' && index.unique) {
        continue
      }
      
      try {
        const options: any = { 
          name: index.name,
          background: true 
        }
        if ('unique' in index && index.unique && index.name !== 'name') {
          options.unique = true
        }
        
        await companiesCollection.createIndex(index.key as any, options)
        console.log(`✅ Created index: ${COLLECTIONS.COMPANIES}.${index.name}`)
      } catch (error: any) {
        if (error.code === 85) { // Index already exists
          console.log(`ℹ️  Index already exists: ${COLLECTIONS.COMPANIES}.${index.name}`)
        } else {
          console.error(`❌ Error creating index ${index.name}:`, error.message)
        }
      }
    }
    
    // Initialize default RAPID questionnaires
    console.log('🔄 Initializing default RAPID questionnaires...')
    const questionnaireResult = await RAPIDQuestionnaireService.initializeDefaultQuestionnaires()
    
    if (questionnaireResult.success) {
      console.log(`✅ Initialized ${questionnaireResult.initialized} RAPID questionnaires`)
    } else {
      console.log(`⚠️  RAPID questionnaire initialization completed with ${questionnaireResult.errors.length} errors:`)
      questionnaireResult.errors.forEach(error => console.log(`   - ${error}`))
    }
    
    console.log('🎉 Database initialization completed successfully!')
    
    return {
      success: true,
      message: 'Database initialized successfully',
      rapidQuestionnaires: {
        initialized: questionnaireResult.initialized,
        errors: questionnaireResult.errors
      }
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
    const collectionNames = collections.map(c => (c as any).name as string)
    
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