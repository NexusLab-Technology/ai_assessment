import { ObjectId } from 'mongodb'
import { getCollection } from '../mongodb'
import { Company, CompanyDocument } from '../../types/assessment'

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

    return documents.map(this.documentToCompany)
  }

  static async findById(id: string, userId: string): Promise<Company | null> {
    const collection = await this.getCollection()
    const document = await collection.findOne({ 
      _id: new ObjectId(id), 
      userId 
    })

    return document ? this.documentToCompany(document) : null
  }

  static async create(data: {
    name: string
    description?: string
    userId: string
  }): Promise<Company> {
    const collection = await this.getCollection()
    const now = new Date()

    const document: Omit<CompanyDocument, '_id'> = {
      name: data.name,
      description: data.description,
      userId: data.userId,
      createdAt: now,
      updatedAt: now
    }

    const result = await collection.insertOne(document)
    const created = await collection.findOne({ _id: result.insertedId })

    if (!created) {
      throw new Error('Failed to create company')
    }

    return this.documentToCompany(created)
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
    const updateData = {
      ...data,
      updatedAt: new Date()
    }

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id), userId },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    return result?.value ? this.documentToCompany(result.value) : null
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

  private static documentToCompany(document: any): Company {
    return {
      id: document._id.toString(),
      name: document.name,
      description: document.description,
      createdAt: document.createdAt,
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