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

    const document: Omit<CompanyDocument, '_id'> = {
      name: data.name.trim(),
      description: data.description?.trim() || undefined, // Store as undefined for consistency
      isActive: true, // New companies are active by default
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
    
    // Index for createdAt (for sorting)
    await collection.createIndex({ createdAt: -1 })
    
    // Index for isActive (for filtering active companies)
    await collection.createIndex({ isActive: 1 })
    
    // Text index for search functionality
    await collection.createIndex({ 
      name: 'text', 
      description: 'text' 
    })
  }
}