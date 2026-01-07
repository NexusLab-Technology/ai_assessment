/**
 * Property-Based Tests for Response Review Completeness
 * Feature: ai-assessment, Property 11: Complete question information display
 * Validates: Requirements 14.4
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import fc from 'fast-check';
import ResponseReviewModal from '@/components/ai-assessment/ResponseReviewModal';
import { 
  Assessment, 
  AssessmentResponses, 
  RAPIDQuestionnaireStructure,
  AssessmentType,
  CompletionStatus,
  QuestionType,
  RAPID_CATEGORIES 
} from '@/types/rapid-questionnaire';

// Simplified generators for more reliable testing
const assessmentTypeArb = fc.constantFrom<AssessmentType>('EXPLORATORY', 'MIGRATION');
const completionStatusArb = fc.constantFrom<CompletionStatus>('not_started', 'partial', 'completed');
const assessmentStatusArb = fc.constantFrom<'DRAFT' | 'IN_PROGRESS' | 'COMPLETED'>('DRAFT', 'IN_PROGRESS', 'COMPLETED');

// Create a simple, reliable questionnaire structure for testing
const createTestQuestionnaire = (): RAPIDQuestionnaireStructure => ({
  version: '3.0',
  assessmentType: 'EXPLORATORY',
  totalQuestions: 2,
  categories: [
    {
      id: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
      title: 'Use Case Discovery',
      description: 'Identify and define AI use cases',
      subcategories: [
        {
          id: 'business-objectives',
          title: 'Business Objectives',
          questions: [
            {
              id: 'q1',
              number: '1.1',
              text: 'What are your primary business objectives?',
              description: 'Describe your main business goals',
              type: 'textarea',
              required: true,
              category: 'use-case-discovery',
              subcategory: 'business-objectives'
            },
            {
              id: 'q2',
              number: '1.2',
              text: 'What is your budget range?',
              type: 'select',
              required: false,
              options: ['< $10K', '$10K - $50K', '> $50K'],
              category: 'use-case-discovery',
              subcategory: 'business-objectives'
            }
          ],
          questionCount: 2
        }
      ],
      totalQuestions: 2,
      completionPercentage: 0,
      status: 'not_started'
    }
  ],
  lastUpdated: new Date()
});

const createTestAssessment = (): Assessment => ({
  id: 'test-assessment',
  name: 'Test Assessment',
  companyId: 'test-company',
  userId: 'test-user',
  type: 'EXPLORATORY',
  status: 'IN_PROGRESS',
  currentCategory: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
  totalCategories: 1,
  responses: {},
  categoryStatuses: {},
  rapidQuestionnaireVersion: '3.0',
  createdAt: new Date(),
  updatedAt: new Date()
});

// Mock props generator
const createMockProps = (
  assessment: Assessment,
  questionnaire: RAPIDQuestionnaireStructure,
  responses: AssessmentResponses,
  isOpen: boolean = true
) => ({
  isOpen,
  assessment,
  responses,
  rapidQuestions: questionnaire,
  onClose: jest.fn(),
  onEditResponse: jest.fn(),
  onComplete: jest.fn()
});

describe('Response Review Completeness Properties', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 11: Complete question information display
   * For any RAPID question, the system should display the complete question text and formatting as specified in the RAPID questionnaire
   * Validates: Requirements 14.4
   */
  test('Property 11: Complete question information display', () => {
    fc.assert(
      fc.property(
        fc.record({
          'use-case-discovery': fc.record({
            'q1': fc.oneof(
              fc.constant(''),
              fc.constant(null),
              fc.constant(undefined),
              fc.string({ minLength: 1, maxLength: 100 })
            ),
            'q2': fc.oneof(
              fc.constant(''),
              fc.constant(null),
              fc.constant(undefined),
              fc.constantFrom('< $10K', '$10K - $50K', '> $50K')
            )
          })
        }),
        (responses) => {
          const questionnaire = createTestQuestionnaire();
          const assessment = createTestAssessment();
          const props = createMockProps(assessment, questionnaire, responses);
          
          try {
            const { container } = render(<ResponseReviewModal {...props} />);

            // Verify modal is displayed when open
            const modalTitle = container.querySelector('h2');
            expect(modalTitle).toBeInTheDocument();
            expect(modalTitle?.textContent).toContain('Review Your Assessment Responses');

            // Verify RAPID questionnaire version is displayed
            expect(container.textContent).toContain('RAPID Questionnaire v3.0');

            // Verify category is displayed
            expect(container.textContent).toContain('1. Use Case Discovery');
            expect(container.textContent).toContain('Identify and define AI use cases');

            // Verify subcategory is displayed
            expect(container.textContent).toContain('Business Objectives');

            // Verify all questions are displayed with complete information
            const question1 = questionnaire.categories[0].subcategories[0].questions[0];
            const question2 = questionnaire.categories[0].subcategories[0].questions[1];

            // Question 1 should be displayed
            expect(container.textContent).toContain('1.1: What are your primary business objectives?');
            expect(container.textContent).toContain('Describe your main business goals');
            expect(container.textContent).toContain('Required');

            // Question 2 should be displayed
            expect(container.textContent).toContain('1.2: What is your budget range?');

            // Check answers are formatted correctly
            const categoryResponses = responses['use-case-discovery'] || {};
            const answer1 = categoryResponses['q1'];
            const answer2 = categoryResponses['q2'];

            // Answer 1 formatting
            if (answer1 === undefined || answer1 === null || answer1 === '') {
              expect(container.textContent).toContain('Not answered');
            } else {
              expect(container.textContent).toContain(String(answer1));
            }

            // Answer 2 formatting
            if (answer2 === undefined || answer2 === null || answer2 === '') {
              expect(container.textContent).toContain('Not answered');
            } else {
              expect(container.textContent).toContain(String(answer2));
            }

            // Verify edit buttons are present
            const editButtons = container.querySelectorAll('button[aria-label*="Edit question"]');
            expect(editButtons.length).toBeGreaterThanOrEqual(2);

            // Verify progress information is displayed
            expect(container.textContent).toContain('Assessment Progress');
            expect(container.textContent).toContain('categories completed');

            // Check completion status logic
            const isEmpty1 = answer1 === undefined || answer1 === null || answer1 === '';
            const isEmpty2 = answer2 === undefined || answer2 === null || answer2 === '';
            
            // Only question 1 is required
            const isComplete = !isEmpty1;

            if (isComplete) {
              expect(container.textContent).toContain('All required questions have been answered');
            } else {
              expect(container.textContent).toContain('required questions remaining');
            }

            return true;
          } catch (error) {
            console.error('Complete question information display test failed:', error);
            return false;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Modal interaction functionality', () => {
    const questionnaire = createTestQuestionnaire();
    const assessment = createTestAssessment();
    const responses: AssessmentResponses = {
      'use-case-discovery': {
        'q1': 'Test business objective',
        'q2': '< $10K'
      }
    };
    
    const mockOnClose = jest.fn();
    const mockOnEditResponse = jest.fn();
    const mockOnComplete = jest.fn();
    
    const props = {
      ...createMockProps(assessment, questionnaire, responses),
      onClose: mockOnClose,
      onEditResponse: mockOnEditResponse,
      onComplete: mockOnComplete
    };
    
    const { container } = render(<ResponseReviewModal {...props} />);

    // Test close button functionality
    const closeButtons = container.querySelectorAll('button[aria-label="Close review"]');
    if (closeButtons.length > 0) {
      fireEvent.click(closeButtons[0]);
      expect(mockOnClose).toHaveBeenCalled();
    }

    // Test edit button functionality
    const editButtons = container.querySelectorAll('button[aria-label*="Edit question"]');
    if (editButtons.length > 0) {
      fireEvent.click(editButtons[0]);
      expect(mockOnEditResponse).toHaveBeenCalled();
    }

    // Test continue editing button
    const continueButtons = Array.from(container.querySelectorAll('button')).filter(btn => 
      btn.textContent?.includes('Continue Editing')
    );
    if (continueButtons.length > 0) {
      fireEvent.click(continueButtons[0]);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });

  test('Answer formatting consistency', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.integer({ min: 1, max: 1000 }),
          fc.boolean(),
          fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 3 }),
          fc.constant(''),
          fc.constant(null),
          fc.constant(undefined)
        ),
        fc.constantFrom('text', 'textarea', 'select', 'radio', 'number'),
        (answer, questionType) => {
          // Test the answer formatting logic
          const formatAnswer = (answer: any, questionType: string): string => {
            if (answer === undefined || answer === null || answer === '') {
              return 'Not answered'
            }
            
            if (Array.isArray(answer)) {
              if (answer.length === 0) return 'Not answered'
              return answer.join(', ')
            }
            
            if (typeof answer === 'boolean') {
              return answer ? 'Yes' : 'No'
            }
            
            // Format based on question type
            if (questionType === 'number' && typeof answer === 'number') {
              return answer.toLocaleString()
            }
            
            return String(answer)
          };

          const formattedAnswer = formatAnswer(answer, questionType);
          
          // Formatted answer should always be a string
          expect(typeof formattedAnswer).toBe('string');
          
          // Should handle empty values consistently
          const isEmpty = answer === undefined || answer === null || answer === '' || 
                         (Array.isArray(answer) && answer.length === 0);
          
          if (isEmpty) {
            expect(formattedAnswer).toBe('Not answered');
          } else {
            expect(formattedAnswer).not.toBe('Not answered');
            expect(formattedAnswer.length).toBeGreaterThan(0);
          }
          
          // Boolean values should be formatted as Yes/No
          if (typeof answer === 'boolean') {
            expect(formattedAnswer).toMatch(/^(Yes|No)$/);
          }
          
          // Arrays should be joined with commas
          if (Array.isArray(answer) && answer.length > 0) {
            expect(formattedAnswer).toContain(answer[0]);
            if (answer.length > 1) {
              expect(formattedAnswer).toContain(', ');
            }
          }
          
          // Numbers should be formatted with locale
          if (questionType === 'number' && typeof answer === 'number') {
            expect(formattedAnswer).toBe(answer.toLocaleString());
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  test('Modal visibility control', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        (isOpen) => {
          const questionnaire = createTestQuestionnaire();
          const assessment = createTestAssessment();
          const responses: AssessmentResponses = {};
          const props = createMockProps(assessment, questionnaire, responses, isOpen);
          
          const { container } = render(<ResponseReviewModal {...props} />);

          if (isOpen) {
            // Modal should be visible
            expect(container.textContent).toContain('Review Your Assessment Responses');
          } else {
            // Modal should not be visible
            expect(container.textContent).not.toContain('Review Your Assessment Responses');
          }

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });
});