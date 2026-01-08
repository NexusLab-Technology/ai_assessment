import { ObjectId } from 'mongodb'
import { getCollection } from '../mongodb'
import { Company, CompanyDocument } from '../../types/company'

export class CompanyModel {
  private static collectionName = 'companies'

  static async getCollection() {
    return getCollection(this.collectionName)
  }

  static async findAll(): Promise<Company[]> {
    const collection = await this.getCollection()
    const documents = await collection
      .find({ 
        $or: [
          { isActive: true },
          { isActive: { $exists: false } } // Backward compatibility for existing records
        ]
      })
      .sort({ createdAt: -1 })
      .toArray()

    const companies = documents.map(this.documentToCompany)
    
    // Get assessment counts for all companies
    if (companies.length > 0) {
      const companyIds = companies.map(c => c.id)
      const assessmentCounts = await this.getAssessmentCounts(companyIds)
      
      // Update companies with their assessment counts
      companies.forEach(company => {
        company.assessmentCount = assessmentCounts[company.id] || 0
      })
    }

    return companies
  }

  static async findById(id: string): Promise<Company | null> {
    const collection = await this.getCollection()
    const document = await collection.findOne({ 
      _id: new ObjectId(id), 
      $or: [
        { isActive: true },
        { isActive: { $exists: false } } // Backward compatibility for existing records
      ]
    })

    if (!document) {
      return null
    }

    const company = this.documentToCompany(document)
    
    // Get assessment count for this company
    company.assessmentCount = await this.getAssessmentCount(id)

    return company
  }

  static async search(query: string): Promise<Company[]> {
    const collection = await this.getCollection()
    
    if (!query.trim()) {
      // Return all companies if no query
      return this.findAll()
    }
    
    // Escape special regex characters
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    
    // Use text search if available, otherwise use regex
    const searchQuery = {
      $and: [
        {
          $or: [
            { isActive: true },
            { isActive: { $exists: false } } // Backward compatibility for existing records
          ]
        },
        {
          $or: [
            { name: { $regex: escapedQuery, $options: 'i' } },
            { description: { $regex: escapedQuery, $options: 'i' } }
          ]
        }
      ]
    }
    
    const documents = await collection
      .find(searchQuery)
      .sort({ createdAt: -1 })
      .toArray()

    const companies = documents.map(this.documentToCompany)
    
    // Get assessment counts for all companies
    if (companies.length > 0) {
      const companyIds = companies.map(c => c.id)
      const assessmentCounts = await this.getAssessmentCounts(companyIds)
      
      // Update companies with their assessment counts
      companies.forEach(company => {
        company.assessmentCount = assessmentCounts[company.id] || 0
      })
    }

    return companies
  }

  static async create(data: {
    name: string
    description?: string
  }): Promise<Company> {
    const collection = await this.getCollection()
    const now = new Date()
    
    const trimmedName = data.name.trim()
    
    // Validate name is not empty
    if (!trimmedName) {
      throw new Error('Company name cannot be empty')
    }
    
    // Check if active company with same name already exists
    // Only check active companies - inactive companies can have duplicate names
    const existingActive = await collection.findOne({ 
      name: trimmedName,
      $or: [
        { isActive: true },
        { isActive: { $exists: false } } // Backward compatibility - treat as active
      ]
    })
    
    if (existingActive) {
      throw new Error(`Company with name "${trimmedName}" already exists`)
    }

    const document: Omit<CompanyDocument, '_id'> = {
      name: trimmedName,
      description: data.description?.trim() || undefined, // Store as undefined for consistency
      isActive: true, // New companies are active by default
      createdAt: now,
      updatedAt: now
    }

    try {
      const result = await collection.insertOne(document)
      const created = await collection.findOne({ _id: result.insertedId })

      if (!created) {
        throw new Error('Failed to create company: Company was not found after creation')
      }

      const company = this.documentToCompany(created)
      // New companies have 0 assessments
      company.assessmentCount = 0

      return company
    } catch (error: any) {
      // Handle MongoDB duplicate key error
      if (error.code === 11000) {
        // Check if it's a name duplicate
        if (error.keyPattern && error.keyPattern.name) {
          throw new Error(`Company with name "${trimmedName}" already exists`)
        }
        // Generic duplicate key error
        throw new Error(`Duplicate key error: ${error.keyValue ? JSON.stringify(error.keyValue) : 'Unknown field'}`)
      }
      
      // Handle validation errors
      if (error.name === 'ValidationError') {
        throw new Error(`Validation error: ${error.message}`)
      }
      
      // Re-throw our custom errors as-is
      if (error.message && (
        error.message.includes('already exists') || 
        error.message.includes('cannot be empty')
      )) {
        throw error
      }
      
      // Generic error with more context
      throw new Error(`Failed to create company: ${error.message || 'Unknown error occurred'}`)
    }
  }

  static async update(
    id: string, 
    data: {
      name?: string
      description?: string
    }
  ): Promise<Company | null> {
    const collection = await this.getCollection()
    
    // First check if the company exists and is active
    const existing = await collection.findOne({ 
      _id: new ObjectId(id), 
      $or: [
        { isActive: true },
        { isActive: { $exists: false } } // Backward compatibility for existing records
      ]
    })
    
    if (!existing) {
      return null
    }
    
    // Filter out undefined values and validate
    const updateData: any = {
      updatedAt: new Date()
    }
    
    if (data.name !== undefined) {
      if (!data.name.trim()) {
        throw new Error('Company name cannot be empty')
      }
      updateData.name = data.name.trim()
    }
    
    if (data.description !== undefined) {
      updateData.description = data.description?.trim() || null
    }

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    if (!result) {
      return null
    }

    const company = this.documentToCompany(result)
    
    // Get current assessment count
    company.assessmentCount = await this.getAssessmentCount(id)

    return company
  }

  static async delete(id: string): Promise<boolean> {
    const collection = await this.getCollection()
    
    // Soft delete: Set isActive to false instead of deleting the record
    const result = await collection.findOneAndUpdate(
      { 
        _id: new ObjectId(id)
      },
      { 
        $set: { 
          isActive: false,
          updatedAt: new Date()
        } 
      },
      { returnDocument: 'after' }
    )

    return result !== null
  }

  static async getAssessmentCount(companyId: string): Promise<number> {
    const assessmentCollection = await getCollection('assessments')
    return assessmentCollection.countDocuments({ 
      companyId: new ObjectId(companyId)
    })
  }

  static async getAssessmentCounts(companyIds: string[]): Promise<{ [companyId: string]: number }> {
    const assessmentCollection = await getCollection('assessments')
    
    // Convert companyIds to ObjectIds
    const objectIds = companyIds.map(id => new ObjectId(id))
    
    // Use aggregation pipeline to get counts for all companies at once
    const pipeline = [
      {
        $match: {
          companyId: { $in: objectIds }
        }
      },
      {
        $group: {
          _id: '$companyId',
          count: { $sum: 1 }
        }
      }
    ]
    
    const results = await assessmentCollection.aggregate(pipeline).toArray()
    
    // Convert to object with companyId as key (string)
    const counts: { [companyId: string]: number } = {}
    companyIds.forEach(id => {
      counts[id] = 0 // Initialize all to 0
    })
    
    results.forEach(result => {
      counts[result._id.toString()] = result.count
    })
    
    return counts
  }

  private static documentToCompany(document: any): Company {
    return {
      id: document._id.toString(),
      name: document.name,
      description: document.description || undefined, // Convert null to undefined
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      assessmentCount: 0 // Will be populated separately when needed
    }
  }

  // Create indexes for better performance
  static async createIndexes() {
    const collection = await this.getCollection()
    
    // Drop old index that includes userId (if exists)
    try {
      await collection.dropIndex('name_userId')
      console.log('✅ Dropped old index: name_userId')
    } catch (error: any) {
      // Index doesn't exist, that's fine
      if (error.code !== 27) { // 27 = IndexNotFound
        console.warn('⚠️  Could not drop name_userId index:', error.message)
      }
    }
    
    // Drop old userId indexes (if exist)
    try {
      await collection.dropIndex('userId_1')
      console.log('✅ Dropped old index: userId_1')
    } catch (error: any) {
      if (error.code !== 27) {
        console.warn('⚠️  Could not drop userId_1 index:', error.message)
      }
    }
    
    try {
      await collection.dropIndex('userId_1_createdAt_-1')
      console.log('✅ Dropped old index: userId_1_createdAt_-1')
    } catch (error: any) {
      if (error.code !== 27) {
        console.warn('⚠️  Could not drop userId_1_createdAt_-1 index:', error.message)
      }
    }
    
    // Drop all unique indexes on name (temporary - user doesn't want database optimization yet)
    const nameIndexesToDrop = ['name_unique', 'name_unique_active', 'name_userId']
    for (const indexName of nameIndexesToDrop) {
      try {
        await collection.dropIndex(indexName)
        console.log(`✅ Dropped index: ${indexName}`)
      } catch (error: any) {
        if (error.code !== 27) { // 27 = IndexNotFound
          console.warn(`⚠️  Could not drop index ${indexName}:`, error.message)
        }
      }
    }
    
    // Create non-unique index on name (for performance, not uniqueness)
    // Uniqueness will be checked in application code
    try {
      await collection.createIndex({ name: 1 }, { name: 'name_1', background: true })
      console.log('✅ Created non-unique index: name_1 (for performance only)')
    } catch (error: any) {
      if (error.code === 85) { // Index already exists
        console.log('ℹ️  Index already exists: name_1')
      } else {
        console.warn('⚠️  Could not create name_1 index:', error.message)
      }
    }
    
    // Index for createdAt (for sorting)
    await collection.createIndex({ createdAt: -1 }, { name: 'createdAt_desc' })
    
    // Index for isActive (for filtering active companies)
    await collection.createIndex({ isActive: 1 }, { name: 'isActive' })
    
    // Text index for search functionality
    try {
      await collection.createIndex({ 
        name: 'text', 
        description: 'text' 
      }, { name: 'name_description_text' })
    } catch (error: any) {
      if (error.code === 85) {
        console.log('ℹ️  Text index already exists')
      }
    }
  }
}