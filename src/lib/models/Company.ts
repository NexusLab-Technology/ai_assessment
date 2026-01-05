import { ObjectId } from 'mongodb'
import { getCollection } from '../mongodb'
import { Company, CompanyDocument } from '../../types/company'

export class CompanyModel {
  private static collectionName = 'companies'

  static async getCollection() {
    return getCollection(this.collectionName)
  }

  static async findAll(userId: string): Promise<Company[]> {
    const collection = await this.getCollection()
    const documents = await collection
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray()

    const companies = documents.map(this.documentToCompany)
    
    // Get assessment counts for all companies
    if (companies.length > 0) {
      const companyIds = companies.map(c => c.id)
      const assessmentCounts = await this.getAssessmentCounts(companyIds, userId)
      
      // Update companies with their assessment counts
      companies.forEach(company => {
        company.assessmentCount = assessmentCounts[company.id] || 0
      })
    }

    return companies
  }

  static async findById(id: string, userId: string): Promise<Company | null> {
    const collection = await this.getCollection()
    const document = await collection.findOne({ 
      _id: new ObjectId(id), 
      userId 
    })

    if (!document) {
      return null
    }

    const company = this.documentToCompany(document)
    
    // Get assessment count for this company
    company.assessmentCount = await this.getAssessmentCount(id, userId)

    return company
  }

  static async search(query: string, userId: string): Promise<Company[]> {
    const collection = await this.getCollection()
    
    if (!query.trim()) {
      // Return all companies if no query
      return this.findAll(userId)
    }
    
    // Escape special regex characters
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    
    // Use text search if available, otherwise use regex
    const searchQuery = {
      userId,
      $or: [
        { name: { $regex: escapedQuery, $options: 'i' } },
        { description: { $regex: escapedQuery, $options: 'i' } }
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
      const assessmentCounts = await this.getAssessmentCounts(companyIds, userId)
      
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
    userId: string
  }): Promise<Company> {
    const collection = await this.getCollection()
    const now = new Date()

    const document: Omit<CompanyDocument, '_id'> = {
      name: data.name.trim(),
      description: data.description?.trim() || null, // Store as null for consistency
      userId: data.userId,
      createdAt: now,
      updatedAt: now
    }

    const result = await collection.insertOne(document)
    const created = await collection.findOne({ _id: result.insertedId })

    if (!created) {
      throw new Error('Failed to create company')
    }

    const company = this.documentToCompany(created)
    // New companies have 0 assessments
    company.assessmentCount = 0

    return company
  }

  static async update(
    id: string, 
    userId: string, 
    data: {
      name?: string
      description?: string
    }
  ): Promise<Company | null> {
    const collection = await this.getCollection()
    
    // First check if the company exists
    const existing = await collection.findOne({ 
      _id: new ObjectId(id), 
      userId 
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
      { _id: new ObjectId(id), userId },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    if (!result) {
      return null
    }

    const company = this.documentToCompany(result)
    
    // Get current assessment count
    company.assessmentCount = await this.getAssessmentCount(id, userId)

    return company
  }

  static async delete(id: string, userId: string): Promise<boolean> {
    const collection = await this.getCollection()
    const result = await collection.deleteOne({ 
      _id: new ObjectId(id), 
      userId 
    })

    return result.deletedCount === 1
  }

  static async getAssessmentCount(companyId: string, userId: string): Promise<number> {
    const assessmentCollection = await getCollection('assessments')
    return assessmentCollection.countDocuments({ 
      companyId, 
      userId 
    })
  }

  static async getAssessmentCounts(companyIds: string[], userId: string): Promise<{ [companyId: string]: number }> {
    const assessmentCollection = await getCollection('assessments')
    
    // Use aggregation pipeline to get counts for all companies at once
    const pipeline = [
      {
        $match: {
          companyId: { $in: companyIds },
          userId: userId
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
    
    // Convert to object with companyId as key
    const counts: { [companyId: string]: number } = {}
    companyIds.forEach(id => {
      counts[id] = 0 // Initialize all to 0
    })
    
    results.forEach(result => {
      counts[result._id] = result.count
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
    
    // Index for user queries
    await collection.createIndex({ userId: 1 })
    
    // Compound index for user + createdAt (for sorting)
    await collection.createIndex({ userId: 1, createdAt: -1 })
    
    // Text index for search functionality
    await collection.createIndex({ 
      name: 'text', 
      description: 'text' 
    })
  }
}