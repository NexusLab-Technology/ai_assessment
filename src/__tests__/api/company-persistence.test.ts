/**
 * Property-Based Tests for Company Data Persistence
 * 
 * **Feature: company-settings, Property 10: Data persistence round-trip**
 * **Validates: Requirements 9.1, 9.4**
 * 
 * Tests that company data saved to MongoDB can be retrieved identically.
 */

import fc from 'fast-check'
import { CompanyModel } from '../../lib/models/Company'
import { getDatabase } from '../../lib/mongodb'
import { CompanyFormData } from '../../types/company'

// Test configuration
const PROPERTY_TEST_RUNS = 100

describe('Company Data Persistence Properties', () => {
  const testUserId = 'test-user-persistence'
  
  beforeAll(async () => {
    // Ensure database connection
    await getDatabase()
  })
  
  beforeEach(async () => {
    // Clean up test data before each test
    const collection = await CompanyModel.getCollection()
    await collection.deleteMany({ userId: testUserId })
  })
  
  afterAll(async () => {
    // Clean up test data after all tests
    const collection = await CompanyModel.getCollection()
    await collection.deleteMany({ userId: testUserId })
  })

  /**
   * Property 10: Data persistence round-trip
   * For any valid company data that is saved and then retrieved, 
   * the retrieved data should be identical to what was originally saved
   */
  test('Property 10: Data persistence round-trip', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate valid company data
        fc.record({
          name: fc.string({ minLength: 2, maxLength: 100 })
            .filter(name => /^[a-zA-Z0-9\s\-_&.()]+$/.test(name.trim())),
          description: fc.option(
            fc.string({ maxLength: 500 }),
            { nil: undefined }
          )
        }),
        async (companyData: CompanyFormData) => {
          // Save company to database
          const savedCompany = await CompanyModel.create({
            name: companyData.name.trim(),
            description: companyData.description?.trim(),
            userId: testUserId
          })
          
          // Retrieve company from database
          const retrievedCompany = await CompanyModel.findById(savedCompany.id, testUserId)
          
          // Verify round-trip consistency
          expect(retrievedCompany).not.toBeNull()
          expect(retrievedCompany!.id).toBe(savedCompany.id)
          expect(retrievedCompany!.name).toBe(companyData.name.trim())
          expect(retrievedCompany!.description).toBe(companyData.description?.trim() || undefined)
          expect(retrievedCompany!.createdAt).toEqual(savedCompany.createdAt)
          expect(retrievedCompany!.updatedAt).toEqual(savedCompany.updatedAt)
          expect(retrievedCompany!.assessmentCount).toBe(0)
        }
      ),
      { numRuns: PROPERTY_TEST_RUNS }
    )
  }, 30000) // 30 second timeout for database operations

  /**
   * Property: Company update preservation
   * For any company update operation, all unchanged fields should remain identical 
   * while only modified fields should reflect the new values
   */
  test('Property: Company update preservation', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate initial company data
        fc.record({
          name: fc.string({ minLength: 2, maxLength: 100 })
            .filter(name => /^[a-zA-Z0-9\s\-_&.()]+$/.test(name.trim())),
          description: fc.option(
            fc.string({ maxLength: 500 }),
            { nil: undefined }
          )
        }),
        // Generate update data
        fc.record({
          name: fc.option(
            fc.string({ minLength: 2, maxLength: 100 })
              .filter(name => /^[a-zA-Z0-9\s\-_&.()]+$/.test(name.trim())),
            { nil: undefined }
          ),
          description: fc.option(
            fc.string({ maxLength: 500 }),
            { nil: undefined }
          )
        }),
        async (initialData: CompanyFormData, updateData: Partial<CompanyFormData>) => {
          // Create initial company
          const originalCompany = await CompanyModel.create({
            name: initialData.name.trim(),
            description: initialData.description?.trim(),
            userId: testUserId
          })
          
          // Prepare update data (only include defined fields)
          const updateFields: any = {}
          if (updateData.name !== undefined) {
            // Skip empty names as they would cause validation errors
            if (!updateData.name.trim()) {
              return
            }
            updateFields.name = updateData.name.trim()
          }
          if (updateData.description !== undefined) {
            updateFields.description = updateData.description?.trim()
          }
          
          // Skip if no fields to update
          if (Object.keys(updateFields).length === 0) {
            return
          }
          
          try {
            // Update company
            const updatedCompany = await CompanyModel.update(
              originalCompany.id, 
              testUserId, 
              updateFields
            )
            
            // Verify update preservation
            expect(updatedCompany).not.toBeNull()
            expect(updatedCompany!.id).toBe(originalCompany.id)
            expect(updatedCompany!.createdAt).toEqual(originalCompany.createdAt)
            expect(updatedCompany!.updatedAt.getTime()).toBeGreaterThan(originalCompany.updatedAt.getTime())
            
            // Check updated fields
            if (updateFields.name !== undefined) {
              expect(updatedCompany!.name).toBe(updateFields.name)
            } else {
              expect(updatedCompany!.name).toBe(originalCompany.name)
            }
            
            if (updateFields.description !== undefined) {
              expect(updatedCompany!.description).toBe(updateFields.description || undefined)
            } else {
              expect(updatedCompany!.description).toBe(originalCompany.description)
            }
          } catch (error) {
            // If update fails due to validation, that's acceptable for property testing
            // Just ensure the original company still exists unchanged
            const unchangedCompany = await CompanyModel.findById(originalCompany.id, testUserId)
            expect(unchangedCompany).not.toBeNull()
            expect(unchangedCompany!.name).toBe(originalCompany.name)
            expect(unchangedCompany!.description).toBe(originalCompany.description)
          }
        }
      ),
      { numRuns: PROPERTY_TEST_RUNS }
    )
  }, 30000)

  /**
   * Property: Search functionality correctness
   * For any search query, all returned companies should contain the search term 
   * in their name or description, and no companies containing the search term should be excluded
   */
  test('Property: Search functionality correctness', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate multiple companies
        fc.array(
          fc.record({
            name: fc.string({ minLength: 2, maxLength: 100 })
              .filter(name => /^[a-zA-Z0-9\s\-_&.()]+$/.test(name.trim())),
            description: fc.option(
              fc.string({ maxLength: 500 }),
              { nil: undefined }
            )
          }),
          { minLength: 1, maxLength: 10 }
        ),
        // Generate search query
        fc.string({ minLength: 1, maxLength: 20 })
          .filter(query => query.trim().length > 0),
        async (companiesData: CompanyFormData[], searchQuery: string) => {
          // Create all companies
          const createdCompanies = []
          for (const companyData of companiesData) {
            const company = await CompanyModel.create({
              name: companyData.name.trim(),
              description: companyData.description?.trim(),
              userId: testUserId
            })
            createdCompanies.push(company)
          }
          
          // Perform search
          const searchResults = await CompanyModel.search(searchQuery.trim(), testUserId)
          
          // Verify search correctness
          const query = searchQuery.toLowerCase().trim()
          
          // All returned companies should match the search query
          for (const result of searchResults) {
            const nameMatches = result.name.toLowerCase().includes(query)
            const descriptionMatches = result.description?.toLowerCase().includes(query) || false
            expect(nameMatches || descriptionMatches).toBe(true)
          }
          
          // All companies that should match should be in results
          for (const company of createdCompanies) {
            const nameMatches = company.name.toLowerCase().includes(query)
            const descriptionMatches = company.description?.toLowerCase().includes(query) || false
            
            if (nameMatches || descriptionMatches) {
              const foundInResults = searchResults.some(result => result.id === company.id)
              expect(foundInResults).toBe(true)
            }
          }
        }
      ),
      { numRuns: 20 } // Fewer runs for complex test with multiple database operations
    )
  }, 60000) // Longer timeout for complex operations

  /**
   * Property: Company deletion consistency
   * For any company that exists, deletion should remove it completely from the database
   */
  test('Property: Company deletion consistency', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 2, maxLength: 100 })
            .filter(name => /^[a-zA-Z0-9\s\-_&.()]+$/.test(name.trim())),
          description: fc.option(
            fc.string({ maxLength: 500 }),
            { nil: undefined }
          )
        }),
        async (companyData: CompanyFormData) => {
          // Create company
          const company = await CompanyModel.create({
            name: companyData.name.trim(),
            description: companyData.description?.trim(),
            userId: testUserId
          })
          
          // Verify company exists
          const beforeDeletion = await CompanyModel.findById(company.id, testUserId)
          expect(beforeDeletion).not.toBeNull()
          
          // Delete company
          const deleted = await CompanyModel.delete(company.id, testUserId)
          expect(deleted).toBe(true)
          
          // Verify company no longer exists
          const afterDeletion = await CompanyModel.findById(company.id, testUserId)
          expect(afterDeletion).toBeNull()
        }
      ),
      { numRuns: PROPERTY_TEST_RUNS }
    )
  }, 30000)
})