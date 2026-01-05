import { CompanyModel } from './models/Company'
import { AssessmentModel } from './models/Assessment'
import { ReportModel } from './models/Report'

/**
 * Initialize database indexes and collections
 * This should be called when the application starts
 */
export async function initializeDatabase() {
  try {
    console.log('Initializing database indexes...')
    
    // Create indexes for all models
    await Promise.all([
      CompanyModel.createIndexes(),
      AssessmentModel.createIndexes(),
      ReportModel.createIndexes()
    ])
    
    console.log('Database indexes created successfully')
  } catch (error) {
    console.error('Failed to initialize database:', error)
    throw error
  }
}

/**
 * Check database connection
 */
export async function checkDatabaseConnection() {
  try {
    const { getDatabase } = await import('./mongodb')
    const db = await getDatabase()
    
    // Ping the database
    await db.admin().ping()
    console.log('Database connection successful')
    return true
  } catch (error) {
    console.error('Database connection failed:', error)
    return false
  }
}