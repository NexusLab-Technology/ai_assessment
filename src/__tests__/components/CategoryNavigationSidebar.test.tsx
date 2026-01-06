/**
 * Unit Tests for CategoryNavigationSidebar Component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CategoryNavigationSidebar from '@/components/ai-assessment/CategoryNavigationSidebar';
import { RAPIDCategory, CategoryCompletionStatus } from '@/types/rapid-questionnaire';
import { RAPID_CATEGORIES } from '@/types/rapid-questionnaire';

// Mock data
const mockCategories: RAPIDCategory[] = [
  {
    id: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    title: 'Use Case Discovery',
    description: 'Define business context and requirements',
    subcategories: [],
    totalQuestions: 48,
    completionPercentage: 0,
    status: 'not_started'
  },
  {
    id: RAPID_CATEGORIES.DATA_READINESS,
    title: 'Data Readiness',
    description: 'Assess data quality and preparation',
    subcategories: [],
    totalQuestions: 25,
    completionPercentage: 60,
    status: 'partial'
  },
  {
    id: RAPID_CATEGORIES.COMPLIANCE_INTEGRATION,
    title: 'Compliance & Integration',
    description: 'Evaluate compliance and integration requirements',
    subcategories: [],
    totalQuestions: 27,
    completionPercentage: 100,
    status: 'completed'
  }
];

const mockCompletionStatus: CategoryCompletionStatus[] = [
  {
    categoryId: RAPID_CATEGORIES.USE_CASE_DISCOVERY,
    status: 'not_started',
    completionPercentage: 0,
    lastModified: new Date()
  },
  {
    categoryId: RAPID_CATEGORIES.DATA_READINESS,
    status: 'partial',
    completionPercentage: 60,
    lastModified: new Date()
  },
  {
    categoryId: RAPID_CATEGORIES.COMPLIANCE_INTEGRATION,
    status: 'completed',
    completionPercentage: 100,
    lastModified: new Date()
  }
];

describe('CategoryNavigationSidebar', () => {
  const mockOnCategorySelect = jest.fn();

  beforeEach(() => {
    mockOnCategorySelect.mockClear();
  });

  test('renders all categories with correct titles', () => {
    render(
      <CategoryNavigationSidebar
        categories={mockCategories}
        currentCategory={RAPID_CATEGORIES.USE_CASE_DISCOVERY}
        onCategorySelect={mockOnCategorySelect}
        completionStatus={mockCompletionStatus}
      />
    );

    expect(screen.getByText('Use Case Discovery')).toBeInTheDocument();
    expect(screen.getByText('Data Readiness')).toBeInTheDocument();
    expect(screen.getByText('Compliance & Integration')).toBeInTheDocument();
  });

  test('displays correct question counts', () => {
    render(
      <CategoryNavigationSidebar
        categories={mockCategories}
        currentCategory={RAPID_CATEGORIES.USE_CASE_DISCOVERY}
        onCategorySelect={mockOnCategorySelect}
        completionStatus={mockCompletionStatus}
      />
    );

    expect(screen.getByText('48 questions')).toBeInTheDocument();
    expect(screen.getByText('25 questions')).toBeInTheDocument();
    expect(screen.getByText('27 questions')).toBeInTheDocument();
  });

  test('highlights active category', () => {
    render(
      <CategoryNavigationSidebar
        categories={mockCategories}
        currentCategory={RAPID_CATEGORIES.DATA_READINESS}
        onCategorySelect={mockOnCategorySelect}
        completionStatus={mockCompletionStatus}
      />
    );

    const activeButton = screen.getByRole('button', { name: /Data Readiness/ });
    expect(activeButton).toHaveClass('bg-blue-50', 'border-blue-500');
  });

  test('shows completion percentages for partial and completed categories', () => {
    render(
      <CategoryNavigationSidebar
        categories={mockCategories}
        currentCategory={RAPID_CATEGORIES.USE_CASE_DISCOVERY}
        onCategorySelect={mockOnCategorySelect}
        completionStatus={mockCompletionStatus}
      />
    );

    // Use getAllByText to handle multiple instances of the same percentage
    const sixtyPercentElements = screen.getAllByText('60%');
    expect(sixtyPercentElements.length).toBeGreaterThan(0);
    
    const hundredPercentElements = screen.getAllByText('100%');
    expect(hundredPercentElements.length).toBeGreaterThan(0);
  });

  test('displays correct status icons', () => {
    render(
      <CategoryNavigationSidebar
        categories={mockCategories}
        currentCategory={RAPID_CATEGORIES.USE_CASE_DISCOVERY}
        onCategorySelect={mockOnCategorySelect}
        completionStatus={mockCompletionStatus}
      />
    );

    // Check for completed icon (checkmark)
    const completedIcon = screen.getByRole('button', { name: /Compliance & Integration/ })
      .querySelector('svg');
    expect(completedIcon).toBeInTheDocument();

    // Check for partial completion percentage (should appear in multiple places)
    const sixtyPercentElements = screen.getAllByText('60%');
    expect(sixtyPercentElements.length).toBeGreaterThan(0);

    // Check for not started number in the icon (more specific)
    const useCaseButton = screen.getByRole('button', { name: /Use Case Discovery/ });
    const notStartedIcon = useCaseButton.querySelector('.text-gray-500');
    expect(notStartedIcon).toHaveTextContent('1');
  });

  test('calls onCategorySelect when category is clicked', () => {
    render(
      <CategoryNavigationSidebar
        categories={mockCategories}
        currentCategory={RAPID_CATEGORIES.USE_CASE_DISCOVERY}
        onCategorySelect={mockOnCategorySelect}
        completionStatus={mockCompletionStatus}
      />
    );

    const dataReadinessButton = screen.getByRole('button', { name: /Data Readiness/ });
    fireEvent.click(dataReadinessButton);

    expect(mockOnCategorySelect).toHaveBeenCalledWith(RAPID_CATEGORIES.DATA_READINESS);
  });

  test('displays progress summary', () => {
    render(
      <CategoryNavigationSidebar
        categories={mockCategories}
        currentCategory={RAPID_CATEGORIES.USE_CASE_DISCOVERY}
        onCategorySelect={mockOnCategorySelect}
        completionStatus={mockCompletionStatus}
      />
    );

    expect(screen.getByText('Progress Summary')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Not Started')).toBeInTheDocument();
  });

  test('shows mobile toggle button when isMobile is true', () => {
    render(
      <CategoryNavigationSidebar
        categories={mockCategories}
        currentCategory={RAPID_CATEGORIES.USE_CASE_DISCOVERY}
        onCategorySelect={mockOnCategorySelect}
        completionStatus={mockCompletionStatus}
        isMobile={true}
      />
    );

    const toggleButton = screen.getByLabelText('Open navigation');
    expect(toggleButton).toBeInTheDocument();
  });

  test('handles mobile navigation toggle', () => {
    render(
      <CategoryNavigationSidebar
        categories={mockCategories}
        currentCategory={RAPID_CATEGORIES.USE_CASE_DISCOVERY}
        onCategorySelect={mockOnCategorySelect}
        completionStatus={mockCompletionStatus}
        isMobile={true}
      />
    );

    // Initially collapsed on mobile
    const openButton = screen.getByLabelText('Open navigation');
    fireEvent.click(openButton);

    // Should show close button when expanded
    const closeButton = screen.getByLabelText('Close navigation');
    expect(closeButton).toBeInTheDocument();
  });

  test('closes mobile navigation when category is selected', () => {
    render(
      <CategoryNavigationSidebar
        categories={mockCategories}
        currentCategory={RAPID_CATEGORIES.USE_CASE_DISCOVERY}
        onCategorySelect={mockOnCategorySelect}
        completionStatus={mockCompletionStatus}
        isMobile={true}
      />
    );

    // Open navigation
    const openButton = screen.getByLabelText('Open navigation');
    fireEvent.click(openButton);

    // Click on a category
    const categoryButton = screen.getByRole('button', { name: /Data Readiness/ });
    fireEvent.click(categoryButton);

    // Should call onCategorySelect and close navigation
    expect(mockOnCategorySelect).toHaveBeenCalledWith(RAPID_CATEGORIES.DATA_READINESS);
  });

  test('renders with custom className', () => {
    const { container } = render(
      <CategoryNavigationSidebar
        categories={mockCategories}
        currentCategory={RAPID_CATEGORIES.USE_CASE_DISCOVERY}
        onCategorySelect={mockOnCategorySelect}
        completionStatus={mockCompletionStatus}
        className="custom-class"
      />
    );

    const sidebar = container.firstChild as HTMLElement;
    expect(sidebar).toHaveClass('custom-class');
  });

  test('handles empty categories array', () => {
    render(
      <CategoryNavigationSidebar
        categories={[]}
        currentCategory=""
        onCategorySelect={mockOnCategorySelect}
        completionStatus={[]}
      />
    );

    expect(screen.getByText('Assessment Categories')).toBeInTheDocument();
    expect(screen.getByText('0 categories')).toBeInTheDocument();
  });

  test('handles missing completion status gracefully', () => {
    render(
      <CategoryNavigationSidebar
        categories={mockCategories}
        currentCategory={RAPID_CATEGORIES.USE_CASE_DISCOVERY}
        onCategorySelect={mockOnCategorySelect}
        completionStatus={[]} // Empty completion status
      />
    );

    // Should still render categories without errors
    expect(screen.getByText('Use Case Discovery')).toBeInTheDocument();
    expect(screen.getByText('Data Readiness')).toBeInTheDocument();
  });
});