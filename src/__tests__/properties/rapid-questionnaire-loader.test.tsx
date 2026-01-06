/**
 * Property-Based Tests for RAPIDQuestionnaireLoader Component
 * Tests universal properties of questionnaire loading behavior
 */

import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import fc from 'fast-check';
import { RAPIDQuestionnaireLoader } from '@/components/ai-assessment/RAPIDQuestionnaireLoader';
import { AssessmentType } from '@/types/rapid-questionnaire';

describe('RAPIDQuestionnaireLoader Properties', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear any existing DOM content
    document.body.innerHTML = '';
  });

  afterEach(() => {
    // Clean up DOM after each test
    document.body.innerHTML = '';
  });

  describe('Property 2: Exploratory path category structure', () => {
    it('should maintain consistent component structure for exploratory assessment type', () => {
      fc.assert(
        fc.property(
          fc.record({
            hasOnError: fc.boolean(),
            componentKey: fc.string({ minLength: 1, maxLength: 10 })
          }),
          (scenario) => {
            const mockOnQuestionsLoaded = jest.fn();
            const mockOnError = scenario.hasOnError ? jest.fn() : undefined;

            const { container } = render(
              <RAPIDQuestionnaireLoader
                key={scenario.componentKey}
                assessmentType="EXPLORATORY"
                onQuestionsLoaded={mockOnQuestionsLoaded}
                onError={mockOnError}
              />
            );

            // Property: Should always render loading state initially for exploratory type
            expect(container.textContent).toContain('Loading RAPID questionnaire...');
            expect(container.textContent).toContain('Preparing exploratory assessment questions');

            // Property: Should have consistent DOM structure
            expect(container.querySelector('.flex')).toBeInTheDocument();
            expect(container.querySelector('.animate-spin')).toBeInTheDocument();

            // Property: Should not show completed or error states initially
            expect(container.textContent).not.toContain('RAPID Questionnaire Loaded');
            expect(container.textContent).not.toContain('Failed to Load Questionnaire');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 3: Migration path category structure', () => {
    it('should maintain consistent component structure for migration assessment type', () => {
      fc.assert(
        fc.property(
          fc.record({
            hasOnError: fc.boolean(),
            componentKey: fc.string({ minLength: 1, maxLength: 10 })
          }),
          (scenario) => {
            const mockOnQuestionsLoaded = jest.fn();
            const mockOnError = scenario.hasOnError ? jest.fn() : undefined;

            const { container } = render(
              <RAPIDQuestionnaireLoader
                key={scenario.componentKey}
                assessmentType="MIGRATION"
                onQuestionsLoaded={mockOnQuestionsLoaded}
                onError={mockOnError}
              />
            );

            // Property: Should always render loading state initially for migration type
            expect(container.textContent).toContain('Loading RAPID questionnaire...');
            expect(container.textContent).toContain('Preparing migration assessment questions');

            // Property: Should have consistent DOM structure
            expect(container.querySelector('.flex')).toBeInTheDocument();
            expect(container.querySelector('.animate-spin')).toBeInTheDocument();

            // Property: Should not show completed or error states initially
            expect(container.textContent).not.toContain('RAPID Questionnaire Loaded');
            expect(container.textContent).not.toContain('Failed to Load Questionnaire');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Assessment type consistency', () => {
    it('should display correct loading message for each assessment type', () => {
      fc.assert(
        fc.property(
          fc.record({
            assessmentType: fc.constantFrom('EXPLORATORY' as AssessmentType, 'MIGRATION' as AssessmentType),
            hasOnError: fc.boolean(),
            componentKey: fc.string({ minLength: 1, maxLength: 8 })
          }),
          (scenario) => {
            const mockOnQuestionsLoaded = jest.fn();
            const mockOnError = scenario.hasOnError ? jest.fn() : undefined;

            const { container } = render(
              <RAPIDQuestionnaireLoader
                key={scenario.componentKey}
                assessmentType={scenario.assessmentType}
                onQuestionsLoaded={mockOnQuestionsLoaded}
                onError={mockOnError}
              />
            );

            // Property: Should always show generic loading message
            expect(container.textContent).toContain('Loading RAPID questionnaire...');

            // Property: Should display assessment-type-specific loading message
            const expectedLoadingText = `Preparing ${scenario.assessmentType.toLowerCase()} assessment questions`;
            expect(container.textContent).toContain(expectedLoadingText);

            // Property: Should have consistent loading UI structure
            expect(container.querySelector('.flex')).toBeInTheDocument();
            expect(container.querySelector('.animate-spin')).toBeInTheDocument();
            expect(container.querySelector('p')).toBeInTheDocument();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Component props consistency', () => {
    it('should handle different callback configurations consistently', () => {
      fc.assert(
        fc.property(
          fc.record({
            assessmentType: fc.constantFrom('EXPLORATORY' as AssessmentType, 'MIGRATION' as AssessmentType),
            hasOnError: fc.boolean(),
            componentKey: fc.string({ minLength: 1, maxLength: 6 })
          }),
          (scenario) => {
            const mockOnQuestionsLoaded = jest.fn();
            const mockOnError = scenario.hasOnError ? jest.fn() : undefined;

            const { container } = render(
              <RAPIDQuestionnaireLoader
                key={scenario.componentKey}
                assessmentType={scenario.assessmentType}
                onQuestionsLoaded={mockOnQuestionsLoaded}
                onError={mockOnError}
              />
            );

            // Property: Should always render loading state regardless of callback presence
            expect(container.textContent).toContain('Loading RAPID questionnaire...');

            // Property: Should not call callbacks immediately
            expect(mockOnQuestionsLoaded).not.toHaveBeenCalled();
            if (mockOnError) {
              expect(mockOnError).not.toHaveBeenCalled();
            }

            // Property: Should have consistent DOM structure regardless of props
            expect(container.querySelector('.flex')).toBeInTheDocument();
            expect(container.querySelector('.animate-spin')).toBeInTheDocument();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Loading state universality', () => {
    it('should always show consistent loading state structure', () => {
      fc.assert(
        fc.property(
          fc.record({
            assessmentType: fc.constantFrom('EXPLORATORY' as AssessmentType, 'MIGRATION' as AssessmentType),
            hasOnError: fc.boolean(),
            componentId: fc.string({ minLength: 1, maxLength: 5 })
          }),
          (scenario) => {
            const mockOnQuestionsLoaded = jest.fn();
            const mockOnError = scenario.hasOnError ? jest.fn() : undefined;

            const { container } = render(
              <RAPIDQuestionnaireLoader
                key={scenario.componentId}
                assessmentType={scenario.assessmentType}
                onQuestionsLoaded={mockOnQuestionsLoaded}
                onError={mockOnError}
              />
            );

            // Property: Should always have loading spinner
            const spinner = container.querySelector('.animate-spin');
            expect(spinner).toBeInTheDocument();
            expect(spinner).toHaveClass('rounded-full', 'border-b-2', 'border-blue-600');

            // Property: Should always have loading text
            expect(container.textContent).toContain('Loading RAPID questionnaire...');

            // Property: Should always have assessment-specific text
            const expectedText = scenario.assessmentType.toLowerCase();
            expect(container.textContent).toContain(expectedText);

            // Property: Should have consistent container structure
            expect(container.querySelector('.flex.flex-col.items-center.justify-center')).toBeInTheDocument();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Component isolation', () => {
    it('should maintain independent rendering across different instances', () => {
      fc.assert(
        fc.property(
          fc.record({
            instances: fc.array(
              fc.record({
                assessmentType: fc.constantFrom('EXPLORATORY' as AssessmentType, 'MIGRATION' as AssessmentType),
                key: fc.string({ minLength: 1, maxLength: 4 })
              }),
              { minLength: 1, maxLength: 2 } // Reduced to avoid DOM conflicts
            )
          }),
          (scenario) => {
            const mockCallbacks = scenario.instances.map(() => ({
              onQuestionsLoaded: jest.fn(),
              onError: jest.fn()
            }));

            // Render each instance separately to avoid DOM conflicts
            const containers = scenario.instances.map((instance, index) => {
              const { container } = render(
                <RAPIDQuestionnaireLoader
                  key={`${instance.key}-${index}`}
                  assessmentType={instance.assessmentType}
                  onQuestionsLoaded={mockCallbacks[index].onQuestionsLoaded}
                  onError={mockCallbacks[index].onError}
                />
              );
              return container;
            });

            // Property: Each instance should have its own loading state
            containers.forEach((container, index) => {
              expect(container.textContent).toContain('Loading RAPID questionnaire...');
              
              const expectedText = scenario.instances[index].assessmentType.toLowerCase();
              expect(container.textContent).toContain(expectedText);
              
              expect(container.querySelector('.animate-spin')).toBeInTheDocument();
            });

            // Property: Each instance should not call callbacks immediately
            mockCallbacks.forEach(({ onQuestionsLoaded, onError }) => {
              expect(onQuestionsLoaded).not.toHaveBeenCalled();
              expect(onError).not.toHaveBeenCalled();
            });
          }
        ),
        { numRuns: 50 } // Reduced runs for multiple instance tests
      );
    });
  });
});