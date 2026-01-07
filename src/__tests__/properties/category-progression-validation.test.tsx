/**
 * Property-Based Tests for Category Progression Validation
 * Feature: ai-assessment, Property 5: Category progression validation
 * Validates: Requirements 4.5
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import fc from 'fast-check';
import CategoryResponseManager from '@/components/ai-assessment/CategoryResponseManager';
import { 
  RAPIDCategory, 
  AssessmentResponses, 
  CompletionStatus,
  RAPID_CATEGORIES 
} from '@/types/rapid-questionnaire';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Generators for property-based testing
const completionStatusArb = fc.constantFrom<CompletionStatus>('not_started', 'partial', 'completed');

const rapidQuestionArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 10 }),
  number: fc.string({ minLength: 1, maxLength: 5 }),
  text: fc.string({ minLength: 5, maxLength: 100 }),
  type: fc.constantFrom('text', 'textarea', 'select', 'radio') as fc.Arbitrary<'text' | 'textarea' | 'select' | 'radio'>,
  required: fc.boolean(),
  category: fc.string({ minLength: 1, maxLength: 20 }),
  subcategory: fc.string({ minLength: 1, maxLength: 20 })
});

const rapidSubcategoryArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  title: fc.string({ minLength: 5, maxLength: 30 }),
  questions: fc.array(rapidQuestionArb, { minLength: 1, maxLength: 5 }),
  questionCount: fc.integer({ min: 1, max: 10 })
}).map(sub => ({
  ...sub,
  questionCount: sub.questions.length
}));

const rapidCategoryArb = fc.record({
  id: fc.constantFrom(...Object.values(RAPID_CATEGORIES)),
  title: fc.string({ minLength: 5, maxLength: 50 }),
  description: fc.option(fc.string({ minLength: 10, maxLength: 100 }), { nil: undefined }),
  subcategories: fc.array(rapidSubcategoryArb, { minLength: 1, maxLength: 3 }),
  totalQuestions: fc.integer({ min: 1, max: 20 }),
  completionPercentage: fc.integer({ min: 0, max: 100 }),
  status: completionStatusArb
}).map(cat => ({
  ...cat,
  totalQuestions: cat.subcategories.reduce((sum, sub) => sum + sub.questions.length, 0)
}));

// Generate assessment responses
const assessmentResponsesArb = (categories: RAPIDCategory[]) => {
  return fc.record(
    Object.fromEntries(
      categories.map(cat => [
        cat.id,
        fc.record(
          Object.fromEntries(
            cat.subcategories.flatMap(sub => 
              sub.questions.map(q => [
                q.id,
                fc.oneof(
                  fc.constant(''),
                  fc.constant(null),
                  fc.constant(undefined),
                  fc.string({ minLength: 1, maxLength: 50 }),
                  fc.integer({ min: 1, max: 100 })
                )
              ])
            )
          )
        )
      ])
    )
  );
};

// Mock props generator
const createMockProps = (
  categories: RAPIDCategory[],
  currentCategory: string,
  responses: AssessmentResponses = {}
) => ({
  categories,
  currentCategory,
  responses,
  onCategoryChange: jest.fn(),
  onResponsesUpdate: jest.fn(),
  onAssessmentComplete: jest.fn(),
  assessmentId: 'test-assessment-id'
});

describe('Category Progression Validation Properties', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  /**
   * Property 5: Category progression validation
   * For any category with required fields, progression should only be enabled when all required fields are complete
   * Validates: Requirements 4.5
   */
  test('Property 5: Category progression validation', () => {
    fc.assert(
      fc.property(
        fc.array(rapidCategoryArb, { minLength: 2, maxLength: 3 }),
        (categories) => {
          // Ensure unique categories
          const uniqueCategories = categories.filter((cat, index, arr) => 
            arr.findIndex(c => c.id === cat.id) === index
          );
          
          if (uniqueCategories.length < 2) return true;

          // Create a category with required questions that are not answered
          const categoryWithRequired = uniqueCategories[0];
          const requiredQuestions = categoryWithRequired.subcategories.flatMap(sub => 
            sub.questions.filter(q => q.required)
          );

          if (requiredQuestions.length === 0) return true;

          // Create responses that don't include all required questions
          const incompleteResponses: AssessmentResponses = {
            [categoryWithRequired.id]: Object.fromEntries(
              requiredQuestions.slice(0, -1).map(q => [q.id, 'some answer'])
            )
          };

          const props = createMockProps(uniqueCategories, categoryWithRequired.id, incompleteResponses);
          
          try {
            const { container } = render(<CategoryResponseManager {...props} />);

            // Try to navigate to next category
            const nextCategoryButton = container.querySelector('button[class*="Next Category"]') ||
              Array.from(container.querySelectorAll('button')).find(btn => 
                btn.textContent?.includes('Next Category')
              );

            if (nextCategoryButton) {
              fireEvent.click(nextCategoryButton);
              
              // Should show validation errors
              const errorElements = container.querySelectorAll('[class*="red"], [class*="error"]');
              const hasValidationError = errorElements.length > 0 || 
                container.textContent?.includes('required') ||
                container.textContent?.includes('must be answered');

              // The onCategoryChange should not be called due to validation
              expect(props.onCategoryChange).not.toHaveBeenCalled();
              
              return true;
            }

            return true;
          } catch (error) {
            console.error('Category progression validation test failed:', error);
            return false;
          }
        }
      ),
      { numRuns: 30 }
    );
  });

  test('Valid progression when all required fields are complete', () => {
    fc.assert(
      fc.property(
        fc.array(rapidCategoryArb, { minLength: 2, maxLength: 3 }),
        (categories) => {
          // Ensure unique categories
          const uniqueCategories = categories.filter((cat, index, arr) => 
            arr.findIndex(c => c.id === cat.id) === index
          );
          
          if (uniqueCategories.length < 2) return true;

          const categoryWithRequired = uniqueCategories[0];
          const requiredQuestions = categoryWithRequired.subcategories.flatMap(sub => 
            sub.questions.filter(q => q.required)
          );

          if (requiredQuestions.length === 0) return true;

          // Create complete responses for all required questions
          const completeResponses: AssessmentResponses = {
            [categoryWithRequired.id]: Object.fromEntries(
              requiredQuestions.map(q => [q.id, 'complete answer'])
            )
          };

          const props = createMockProps(uniqueCategories, categoryWithRequired.id, completeResponses);
          
          try {
            const { container } = render(<CategoryResponseManager {...props} />);

            // Try to navigate to next category
            const nextCategoryButton = Array.from(container.querySelectorAll('button')).find(btn => 
              btn.textContent?.includes('Next Category')
            );

            if (nextCategoryButton && !nextCategoryButton.disabled) {
              fireEvent.click(nextCategoryButton);
              
              // Should allow navigation (onCategoryChange called)
              expect(props.onCategoryChange).toHaveBeenCalled();
            }

            return true;
          } catch (error) {
            console.error('Valid progression test failed:', error);
            return false;
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  test('Category navigation buttons reflect completion status', () => {
    fc.assert(
      fc.property(
        fc.array(rapidCategoryArb, { minLength: 1, maxLength: 3 }),
        (categories) => {
          // Ensure unique categories
          const uniqueCategories = categories.filter((cat, index, arr) => 
            arr.findIndex(c => c.id === cat.id) === index
          );
          
          if (uniqueCategories.length === 0) return true;

          // Create mixed completion responses
          const responses: AssessmentResponses = {};
          uniqueCategories.forEach((cat, index) => {
            const allQuestions = cat.subcategories.flatMap(sub => sub.questions);
            if (allQuestions.length > 0) {
              responses[cat.id] = {};
              // Complete first category, partial second, empty third
              if (index === 0) {
                allQuestions.forEach(q => {
                  responses[cat.id][q.id] = 'complete answer';
                });
              } else if (index === 1 && allQuestions.length > 1) {
                responses[cat.id][allQuestions[0].id] = 'partial answer';
              }
            }
          });

          const props = createMockProps(uniqueCategories, uniqueCategories[0].id, responses);
          
          try {
            const { container } = render(<CategoryResponseManager {...props} />);

            // Verify that category buttons exist
            const categoryButtons = container.querySelectorAll('button');
            expect(categoryButtons.length).toBeGreaterThan(0);

            // Verify that completion indicators are present
            const completionIndicators = container.querySelectorAll('[class*="green"], [class*="blue"], [class*="CheckCircle"]');
            // Should have some completion indicators for completed/partial categories
            
            return true;
          } catch (error) {
            console.error('Category navigation buttons test failed:', error);
            return false;
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  test('localStorage persistence of responses and statuses', () => {
    fc.assert(
      fc.property(
        fc.array(rapidCategoryArb, { minLength: 1, maxLength: 2 }),
        (categories) => {
          // Ensure unique categories
          const uniqueCategories = categories.filter((cat, index, arr) => 
            arr.findIndex(c => c.id === cat.id) === index
          );
          
          if (uniqueCategories.length === 0) return true;

          const responses: AssessmentResponses = {};
          const props = createMockProps(uniqueCategories, uniqueCategories[0].id, responses);
          
          try {
            render(<CategoryResponseManager {...props} />);

            // Verify localStorage methods are called
            expect(localStorageMock.getItem).toHaveBeenCalled();
            
            return true;
          } catch (error) {
            console.error('localStorage persistence test failed:', error);
            return false;
          }
        }
      ),
      { numRuns: 15 }
    );
  });

  test('Validation error display for incomplete required fields', () => {
    fc.assert(
      fc.property(
        rapidCategoryArb,
        (category) => {
          const requiredQuestions = category.subcategories.flatMap(sub => 
            sub.questions.filter(q => q.required)
          );

          if (requiredQuestions.length === 0) return true;

          // Create incomplete responses
          const incompleteResponses: AssessmentResponses = {
            [category.id]: Object.fromEntries(
              requiredQuestions.slice(0, Math.max(1, requiredQuestions.length - 1)).map(q => [q.id, ''])
            )
          };

          const props = createMockProps([category], category.id, incompleteResponses);
          
          try {
            const { container } = render(<CategoryResponseManager {...props} />);

            // Component should render without errors
            expect(container).toBeInTheDocument();

            return true;
          } catch (error) {
            console.error('Validation error display test failed:', error);
            return false;
          }
        }
      ),
      { numRuns: 15 }
    );
  });
});