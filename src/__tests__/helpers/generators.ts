import * as fc from 'fast-check'
import { Assessment, Company, Question, QuestionSection } from '../../types/assessment'

/**
 * Helper generators for property-based testing with correct TypeScript types
 */

// Assessment type generator
export const assessmentTypeGenerator = fc.constantFrom('EXPLORATORY' as const, 'MIGRATION' as const)

// Assessment status generator  
export const assessmentStatusGenerator = fc.constantFrom('DRAFT' as const, 'IN_PROGRESS' as const, 'COMPLETED' as const)

// Question type generator
export const questionTypeGenerator = fc.constantFrom(
  'text' as const, 
  'textarea' as const, 
  'select' as const, 
  'multiselect' as const, 
  'radio' as const, 
  'checkbox' as const, 
  'number' as const
)

// Company generator
export const companyGenerator = fc.record({
  id: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
  name: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
  description: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
  createdAt: fc.date(),
  assessmentCount: fc.integer({ min: 0, max: 100 })
}) as fc.Arbitrary<Company>

// Assessment generator with proper business logic constraints
export const assessmentGenerator = fc.record({
  id: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
  name: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
  companyId: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
  type: assessmentTypeGenerator,
  status: assessmentStatusGenerator,
  createdAt: fc.date(),
}).chain(baseAssessment => {
  // Set totalSteps based on assessment type (business rule)
  const totalSteps = baseAssessment.type === 'EXPLORATORY' ? 7 : 8
  
  return fc.record({
    id: fc.constant(baseAssessment.id),
    name: fc.constant(baseAssessment.name),
    companyId: fc.constant(baseAssessment.companyId),
    type: fc.constant(baseAssessment.type),
    status: fc.constant(baseAssessment.status),
    createdAt: fc.constant(baseAssessment.createdAt),
    totalSteps: fc.constant(totalSteps),
    currentStep: fc.integer({ min: 1, max: totalSteps }),
    updatedAt: fc.date({ min: baseAssessment.createdAt }), // updatedAt >= createdAt
    completedAt: baseAssessment.status === 'COMPLETED' 
      ? fc.date({ min: baseAssessment.createdAt }) // completedAt >= createdAt if completed
      : fc.option(fc.date({ min: baseAssessment.createdAt }), { nil: undefined })
  })
}) as fc.Arbitrary<Assessment>

// Question generator with proper options constraints
export const questionGenerator = fc.record({
  id: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
  type: questionTypeGenerator,
  label: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
  description: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
  required: fc.boolean(),
  validation: fc.option(
    fc.record({
      required: fc.option(fc.boolean(), { nil: undefined }),
      minLength: fc.option(fc.integer({ min: 0 }), { nil: undefined }),
      maxLength: fc.option(fc.integer({ min: 1 }), { nil: undefined }),
      min: fc.option(fc.integer(), { nil: undefined }),
      max: fc.option(fc.integer(), { nil: undefined }),
      pattern: fc.option(fc.string(), { nil: undefined })
    }),
    { nil: undefined }
  )
}).chain(baseQuestion => {
  // Add options based on question type (business rule)
  const needsOptions = ['select', 'multiselect', 'radio'].includes(baseQuestion.type)
  
  return fc.record({
    id: fc.constant(baseQuestion.id),
    type: fc.constant(baseQuestion.type),
    label: fc.constant(baseQuestion.label),
    description: fc.constant(baseQuestion.description),
    required: fc.constant(baseQuestion.required),
    validation: fc.constant(baseQuestion.validation),
    options: needsOptions 
      ? fc.array(fc.record({
          value: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          label: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0)
        }), { minLength: 1, maxLength: 5 }) // Ensure at least 1 option for select/multiselect/radio
      : fc.option(
          fc.array(fc.record({
            value: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
            label: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0)
          })),
          { nil: undefined }
        )
  })
}) as fc.Arbitrary<Question>

// Question section generator
export const questionSectionGenerator = fc.record({
  id: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
  title: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
  description: fc.string({ maxLength: 200 }),
  questions: fc.array(questionGenerator, { minLength: 1, maxLength: 5 }),
  stepNumber: fc.integer({ min: 1, max: 10 })
}) as fc.Arbitrary<QuestionSection>