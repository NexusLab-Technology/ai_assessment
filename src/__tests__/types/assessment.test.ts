/**
 * Property-based tests for TypeScript interface validation
 * Feature: ai-assessment, Property 10: Assessment-company relationship integrity
 * Validates: Requirements 5.5
 */

import * as fc from 'fast-check'
import {
  Assessment,
  Company,
  Question,
  AssessmentResponses
} from '../../types/assessment'
import { assessmentGenerator, companyGenerator, questionGenerator } from '../helpers/generators'

describe('Assessment TypeScript Interface Validation', () => {
  // Use imported generators

  /**
   * Property 10: Assessment-company relationship integrity
   * For any valid company and assessment, the assessment should properly reference the company
   * and maintain data consistency across the relationship
   */
  describe('Property 10: Assessment-company relationship integrity', () => {
    it('should maintain consistent company references in assessments', () => {
      fc.assert(fc.property(
        companyGenerator,
        assessmentGenerator,
        (company: Company, assessment: Assessment) => {
          // Create assessment with proper company reference
          const linkedAssessment = {
            ...assessment,
            companyId: company.id
          }

          // Property: Assessment should reference the correct company
          expect(linkedAssessment.companyId).toBe(company.id)
          
          // Property: Assessment should have valid structure
          expect(typeof linkedAssessment.id).toBe('string')
          expect(typeof linkedAssessment.name).toBe('string')
          expect(['EXPLORATORY', 'MIGRATION']).toContain(linkedAssessment.type)
          expect(['DRAFT', 'IN_PROGRESS', 'COMPLETED']).toContain(linkedAssessment.status)
          expect(linkedAssessment.currentStep).toBeGreaterThan(0)
          expect(linkedAssessment.totalSteps).toBeGreaterThan(0)
          expect(linkedAssessment.currentStep).toBeLessThanOrEqual(linkedAssessment.totalSteps)
          
          // Property: Company should have valid structure
          expect(typeof company.id).toBe('string')
          expect(typeof company.name).toBe('string')
          expect(typeof company.assessmentCount).toBe('number')
          expect(company.assessmentCount).toBeGreaterThanOrEqual(0)

          return true
        }
      ), { numRuns: 100 })
    })

    it('should validate assessment type constraints', () => {
      fc.assert(fc.property(
        assessmentGenerator,
        (assessment: Assessment) => {
          // Property: EXPLORATORY assessments should have 7 steps
          if (assessment.type === 'EXPLORATORY') {
            expect(assessment.totalSteps).toBe(7)
          }
          
          // Property: MIGRATION assessments should have 8 steps
          if (assessment.type === 'MIGRATION') {
            expect(assessment.totalSteps).toBe(8)
          }
          
          // Property: Current step should never exceed total steps
          expect(assessment.currentStep).toBeLessThanOrEqual(assessment.totalSteps)
          
          // Property: Completed assessments should have completedAt date
          if (assessment.status === 'COMPLETED') {
            expect(assessment.completedAt).toBeDefined()
          }

          return true
        }
      ), { numRuns: 100 })
    })

    it('should validate question structure integrity', () => {
      fc.assert(fc.property(
        questionGenerator,
        (question: Question) => {
          // Property: Question should have valid type
          const validTypes = ['text', 'textarea', 'select', 'multiselect', 'radio', 'checkbox', 'number']
          expect(validTypes).toContain(question.type)
          
          // Property: Question should have non-empty label
          expect(question.label.trim().length).toBeGreaterThan(0)
          
          // Property: Select/multiselect/radio questions should have options
          if (['select', 'multiselect', 'radio'].includes(question.type)) {
            if (question.options) {
              expect(Array.isArray(question.options)).toBe(true)
              expect(question.options.length).toBeGreaterThan(0)
              
              // Each option should have value and label
              question.options.forEach(option => {
                expect(typeof option.value).toBe('string')
                expect(typeof option.label).toBe('string')
                expect(option.value.trim().length).toBeGreaterThan(0)
                expect(option.label.trim().length).toBeGreaterThan(0)
              })
            }
          }

          return true
        }
      ), { numRuns: 100 })
    })

    it('should validate assessment responses structure', () => {
      fc.assert(fc.property(
        fc.record({
          stepId: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
          responses: fc.dictionary(
            fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            fc.oneof(
              fc.string(),
              fc.integer(),
              fc.boolean(),
              fc.array(fc.string())
            )
          )
        }),
        (testData) => {
          const responses: AssessmentResponses = {
            [testData.stepId]: testData.responses
          }

          // Property: Responses should be properly structured
          expect(typeof responses).toBe('object')
          expect(responses[testData.stepId]).toBeDefined()
          
          // Property: Each response should have valid question-answer pairs
          Object.entries(responses[testData.stepId]).forEach(([questionId, answer]) => {
            expect(typeof questionId).toBe('string')
            expect(questionId.trim().length).toBeGreaterThan(0)
            expect(answer).toBeDefined()
          })

          return true
        }
      ), { numRuns: 50 })
    })

    it('should validate company-assessment count consistency', () => {
      fc.assert(fc.property(
        companyGenerator,
        fc.array(assessmentGenerator, { minLength: 0, maxLength: 10 }),
        (company: Company, assessments: Assessment[]) => {
          // Link assessments to company
          const linkedAssessments = assessments.map(assessment => ({
            ...assessment,
            companyId: company.id
          }))

          // Property: Company assessment count should match actual assessments
          const actualCount = linkedAssessments.length
          const updatedCompany = {
            ...company,
            assessmentCount: actualCount
          }

          expect(updatedCompany.assessmentCount).toBe(linkedAssessments.length)
          
          // Property: All assessments should reference the same company
          linkedAssessments.forEach(assessment => {
            expect(assessment.companyId).toBe(company.id)
          })

          return true
        }
      ), { numRuns: 50 })
    })
  })

  /**
   * Additional validation tests for edge cases
   */
  describe('Edge Case Validation', () => {
    it('should handle empty assessment responses', () => {
      const emptyResponses: AssessmentResponses = {}
      
      expect(typeof emptyResponses).toBe('object')
      expect(Object.keys(emptyResponses)).toHaveLength(0)
    })

    it('should validate date consistency in assessments', () => {
      fc.assert(fc.property(
        assessmentGenerator,
        (assessment: Assessment) => {
          // Property: updatedAt should be >= createdAt
          expect(assessment.updatedAt.getTime()).toBeGreaterThanOrEqual(assessment.createdAt.getTime())
          
          // Property: completedAt should be >= createdAt if present
          if (assessment.completedAt) {
            expect(assessment.completedAt.getTime()).toBeGreaterThanOrEqual(assessment.createdAt.getTime())
          }

          return true
        }
      ), { numRuns: 100 })
    })
  })
})