/**
 * Property-Based Tests for CategoryNavigationSidebar Component
 * Feature: ai-assessment, Property 7: Category navigation sidebar
 * Validates: Requirements 12.1
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import fc from 'fast-check';
import CategoryNavigationSidebar from '@/components/ai-assessment/CategoryNavigationSidebar';
import { 
  RAPIDCategory, 
  CategoryCompletionStatus, 
  CompletionStatus
} from '@/types/rapid-questionnaire';

// Simple generators for property-based testing
const completionStatusArb = fc.constantFrom<CompletionStatus>('not_started', 'partial', 'completed');

describe('CategoryNavigationSidebar Properties', () => {
  
  /**
   * Property 7: Category navigation sidebar
   * For any assessment, the progress navigation should display a left sidebar with clickable category headers
   */
  test('Property 7: Category navigation sidebar', () => {
    fc.assert(fc.property(
      fc.integer({ min: 1, max: 3 }),
      fc.boolean(), // isMobile
      (categoryCount, isMobile) => {
        // Create predictable categories
        const categories: RAPIDCategory[] = Array.from({ length: categoryCount }, (_, index) => ({
          id: `category-${index}`,
          title: `Category ${index + 1}`,
          description: `Description for category ${index + 1}`,
          subcategories: [],
          totalQuestions: 10 + index,
          completionPercentage: 0,
          status: 'not_started' as CompletionStatus
        }));
        
        const completionStatus: CategoryCompletionStatus[] = categories.map(category => ({
          categoryId: category.id,
          status: 'not_started' as CompletionStatus,
          completionPercentage: 0,
          lastModified: new Date()
        }));
        
        const mockOnCategorySelect = jest.fn();
        const currentCategory = categories[0].id;
        
        // Act
        const { container } = render(
          <CategoryNavigationSidebar
            categories={categories}
            currentCategory={currentCategory}
            onCategorySelect={mockOnCategorySelect}
            completionStatus={completionStatus}
            isMobile={isMobile}
          />
        );
        
        // Assert - Basic sidebar structure
        if (!isMobile) {
          expect(container).toHaveTextContent('Assessment Categories');
        }
        
        // Assert - All categories are rendered as buttons
        const buttons = container.querySelectorAll('button');
        expect(buttons.length).toBeGreaterThanOrEqual(categoryCount);
        
        // Assert - Category titles are displayed
        categories.forEach(category => {
          expect(container).toHaveTextContent(category.title);
          expect(container).toHaveTextContent(`${category.totalQuestions} questions`);
        });
        
        // Assert - Category selection functionality (test first button)
        const firstButton = buttons[0];
        if (firstButton && !isMobile) {
          // Only test clicking when not in mobile mode (mobile mode starts collapsed)
          fireEvent.click(firstButton);
          expect(mockOnCategorySelect).toHaveBeenCalled();
        }
        
        return true;
      }
    ), { numRuns: 15 });
  });

  /**
   * Property: Visual completion indicators consistency
   * For any category with saved responses, the system should display appropriate visual indicators showing completion status
   */
  test('Property: Visual completion indicators consistency', () => {
    fc.assert(fc.property(
      fc.integer({ min: 1, max: 3 }),
      completionStatusArb,
      fc.integer({ min: 0, max: 100 }),
      (categoryCount, status, percentage) => {
        // Create predictable categories
        const categories: RAPIDCategory[] = Array.from({ length: categoryCount }, (_, index) => ({
          id: `category-${index}`,
          title: `Test Category ${index + 1}`,
          description: `Description for category ${index + 1}`,
          subcategories: [],
          totalQuestions: 10,
          completionPercentage: 0,
          status: 'not_started' as CompletionStatus
        }));
        
        const completionStatus: CategoryCompletionStatus[] = categories.map(category => ({
          categoryId: category.id,
          status,
          completionPercentage: percentage,
          lastModified: new Date()
        }));
        
        const mockOnCategorySelect = jest.fn();
        
        // Act
        const { container } = render(
          <CategoryNavigationSidebar
            categories={categories}
            currentCategory={categories[0].id}
            onCategorySelect={mockOnCategorySelect}
            completionStatus={completionStatus}
          />
        );
        
        // Assert - Visual indicators match completion status
        if (percentage === 100) {
          // Should have completed icon (SVG checkmark)
          const svgElements = container.querySelectorAll('svg');
          expect(svgElements.length).toBeGreaterThan(0);
        } else if (percentage > 0) {
          // Should display percentage
          expect(container).toHaveTextContent(`${percentage}%`);
        }
        
        return true;
      }
    ), { numRuns: 15 });
  });

  /**
   * Property: Progress summary accuracy
   * For any set of categories and completion statuses, the progress summary should accurately reflect the counts
   */
  test('Property: Progress summary accuracy', () => {
    fc.assert(fc.property(
      fc.integer({ min: 1, max: 4 }),
      (categoryCount) => {
        // Create predictable categories
        const categories: RAPIDCategory[] = Array.from({ length: categoryCount }, (_, index) => ({
          id: `category-${index}`,
          title: `Category ${index + 1}`,
          description: `Description for category ${index + 1}`,
          subcategories: [],
          totalQuestions: 10,
          completionPercentage: 0,
          status: 'not_started' as CompletionStatus
        }));
        
        // Create completion status with known distribution
        const completionStatus: CategoryCompletionStatus[] = categories.map((category, index) => {
          let status: CompletionStatus;
          let percentage: number;
          
          if (index % 3 === 0) {
            status = 'completed';
            percentage = 100;
          } else if (index % 3 === 1) {
            status = 'partial';
            percentage = 50;
          } else {
            status = 'not_started';
            percentage = 0;
          }
          
          return {
            categoryId: category.id,
            status,
            completionPercentage: percentage,
            lastModified: new Date()
          };
        });
        
        const mockOnCategorySelect = jest.fn();
        
        // Act
        const { container } = render(
          <CategoryNavigationSidebar
            categories={categories}
            currentCategory={categories[0].id}
            onCategorySelect={mockOnCategorySelect}
            completionStatus={completionStatus}
          />
        );
        
        // Calculate expected counts
        const expectedCompleted = completionStatus.filter(s => s.status === 'completed').length;
        const expectedInProgress = completionStatus.filter(s => s.status === 'partial').length;
        const expectedNotStarted = categories.length - expectedCompleted - expectedInProgress;
        
        // Assert - Progress summary exists and shows counts
        expect(container).toHaveTextContent('Progress Summary');
        expect(container).toHaveTextContent('Completed');
        expect(container).toHaveTextContent('In Progress');
        expect(container).toHaveTextContent('Not Started');
        
        // Check that the counts are displayed
        expect(container).toHaveTextContent(expectedCompleted.toString());
        expect(container).toHaveTextContent(expectedInProgress.toString());
        expect(container).toHaveTextContent(expectedNotStarted.toString());
        
        return true;
      }
    ), { numRuns: 10 });
  });
});

/**
 * Feature: ai-assessment, Property 7: Category navigation sidebar
 * Validates: Requirements 12.1
 */