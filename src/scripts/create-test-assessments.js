const { MongoClient } = require('mongodb')
require('dotenv').config({ path: '.env.local' })

async function createTestAssessments() {
  const client = new MongoClient(process.env.MONGODB_URI)
  
  try {
    await client.connect()
    console.log('Connected to MongoDB')
    
    const db = client.db(process.env.MONGODB_DB)
    const companiesCollection = db.collection('companies')
    const assessmentsCollection = db.collection('assessments')
    
    // Get existing companies
    const companies = await companiesCollection.find({}).toArray()
    console.log(`Found ${companies.length} companies`)
    
    if (companies.length === 0) {
      console.log('No companies found. Please create some companies first.')
      return
    }
    
    // Create test assessments for each company
    const testUserId = 'dev-user-id' // Match the userId used by the API
    
    for (const company of companies) {
      const companyId = company._id.toString()
      
      // Create 2-3 assessments per company
      const assessmentCount = Math.floor(Math.random() * 3) + 1
      
      for (let i = 0; i < assessmentCount; i++) {
        const assessment = {
          name: `Assessment ${i + 1} for ${company.name}`,
          companyId: companyId,
          userId: testUserId,
          type: i % 2 === 0 ? 'EXPLORATORY' : 'MIGRATION',
          status: 'DRAFT',
          currentStep: 1,
          totalSteps: i % 2 === 0 ? 7 : 8,
          responses: {},
          createdAt: new Date(),
          updatedAt: new Date()
        }
        
        await assessmentsCollection.insertOne(assessment)
        console.log(`Created assessment: ${assessment.name}`)
      }
    }
    
    console.log('Test assessments created successfully!')
    
  } catch (error) {
    console.error('Error creating test assessments:', error)
  } finally {
    await client.close()
  }
}

createTestAssessments()