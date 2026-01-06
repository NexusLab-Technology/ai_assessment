/**
 * Unit Tests for RAPIDQuestionnaireLoader Component
 * Tests the loading and display of RAPID questionnaire data
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RAPIDQuestionnaireLoader } from '@/components/ai-assessment/RAPIDQuestionnaireLoader';
import { AssessmentType, RAPIDQuestionnaireStructure } from '@/types/rapid-questionnaire';

// Mock the complete questionnaire data
jest.mock('@/data/rapid-questionnaire-complete', () => ({
  getRAPIDQuestionnaire: jest.fn()
}));

import { getRAPIDQuestionnaire } from '@/data/rapid-questionnaire-complete';

const mockGetRAPIDQuestionnaire = getRAPIDQuestionnaire as jest.MockedFunction<typeof getRAPIDQuestionnaire>;

describe('RAPIDQuestionnaireLoader Component', () => {
  const mockOnQuestionsLoaded = jest.fn();
  const mockOnError = jest.fn();

  const mockExploratoryQuestionnaire: RAPIDQuestionnaireStructure = {
    version: '3.0',
    assessmentType: 'EXPLORATORY' as AssessmentType,
    totalQuestions: 110,
    lastUpdated: new Date('2025-01-06'),
    categories: [
      {
        id: 'use-case-discovery',
        title: 'Use Case Discovery',
        description: 'Business context and requirements',
        subcategories: [],
        totalQuestions: 48,
        completionPercentage: 0,
        status: 'not_started'
      },
      {
        id: 'data-readiness',
        title: 'Data Readiness Assessment',
        description: 'Data preparation and quality',
        subcategories: [],
        totalQuestions: 25,
        completionPercentage: 0,
        status: 'not_started'
      }
    ]
  };

  const mockMigrationQuestionnaire: RAPIDQuestionnaireStructure = {
    version: '3.0',
    assessmentType: 'MIGRATION' as AssessmentType,
    totalQuestions: 162,
    lastUpdated: new Date('2025-01-06'),
    categories: [
      {
        id: 'use-case-discovery',
        title: 'Use Case Discovery',
        description: 'Business context and requirements',
        subcategories: [],
        totalQuestions: 48,
        completionPercentage: 0,
        status: 'not_started'
      },
      {
        id: 'current-system-assessment',
        title: 'Current System Assessment',
        description: 'Existing system evaluation',
        subcategories: [],
        totalQuestions: 52,
        completionPercentage: 0,
        status: 'not_started'
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset timers for each test
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Loading State', () => {
    it('should display loading spinner and message initially', () => {
      mockGetRAPIDQuestionnaire.mockReturnValue(mockExploratoryQuestionnaire);
      
      render(
        <RAPIDQuestionnaireLoader
          assessmentType="EXPLORATORY"
          onQuestionsLoaded={mockOnQuestionsLoaded}
          onError={mockOnError}
        />
      );

      expect(screen.getByText('Loading RAPID questionnaire...')).toBeInTheDocument();
      expect(screen.getByText('Preparing exploratory assessment questions')).toBeInTheDocument();
    });

    it('should show loading state for both assessment types', () => {
      mockGetRAPIDQuestionnaire.mockReturnValue(mockMigrationQuestionnaire);
      
      render(
        <RAPIDQuestionnaireLoader
          assessmentType="MIGRATION"
          onQuestionsLoaded={mockOnQuestionsLoaded}
          onError={mockOnError}
        />
      );

      expect(screen.getByText('Loading RAPID questionnaire...')).toBeInTheDocument();
      expect(screen.getByText('Preparing migration assessment questions')).toBeInTheDocument();
    });
  });

  describe('Successful Loading', () => {
    it('should load and display exploratory questionnaire data', async () => {
      mockGetRAPIDQuestionnaire.mockReturnValue(mockExploratoryQuestionnaire);
      
      render(
        <RAPIDQuestionnaireLoader
          assessmentType="EXPLORATORY"
          onQuestionsLoaded={mockOnQuestionsLoaded}
          onError={mockOnError}
        />
      );

      // Fast-forward through the loading delay
      jest.advanceTimersByTime(500);
      
      await waitFor(() => {
        expect(screen.getByText('RAPID Questionnaire Loaded')).toBeInTheDocument();
      });

      expect(screen.getByText('New GenAI Development')).toBeInTheDocument();
      expect(screen.getByText('3.0')).toBeInTheDocument();
      expect(screen.getByText('110')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // Number of categories
      expect(screen.getByText('Use Case Discovery')).toBeInTheDocument();
      expect(screen.getByText('Data Readiness Assessment')).toBeInTheDocument();
      expect(mockOnQuestionsLoaded).toHaveBeenCalledWith(mockExploratoryQuestionnaire);
    });

    it('should load and display migration questionnaire data', async () => {
      mockGetRAPIDQuestionnaire.mockReturnValue(mockMigrationQuestionnaire);
      
      render(
        <RAPIDQuestionnaireLoader
          assessmentType="MIGRATION"
          onQuestionsLoaded={mockOnQuestionsLoaded}
          onError={mockOnError}
        />
      );

      jest.advanceTimersByTime(500);
      
      await waitFor(() => {
        expect(screen.getByText('RAPID Questionnaire Loaded')).toBeInTheDocument();
      });

      expect(screen.getByText('GenAI Migration to AWS')).toBeInTheDocument();
      expect(screen.getByText('162')).toBeInTheDocument();
      expect(screen.getByText('Current System Assessment')).toBeInTheDocument();
      expect(mockOnQuestionsLoaded).toHaveBeenCalledWith(mockMigrationQuestionnaire);
    });

    it('should display question counts for each category', async () => {
      mockGetRAPIDQuestionnaire.mockReturnValue(mockExploratoryQuestionnaire);
      
      render(
        <RAPIDQuestionnaireLoader
          assessmentType="EXPLORATORY"
          onQuestionsLoaded={mockOnQuestionsLoaded}
          onError={mockOnError}
        />
      );

      jest.advanceTimersByTime(500);
      
      await waitFor(() => {
        expect(screen.getByText('48 questions')).toBeInTheDocument();
        expect(screen.getByText('25 questions')).toBeInTheDocument();
      });
    });

    it('should format and display the last updated date', async () => {
      mockGetRAPIDQuestionnaire.mockReturnValue(mockExploratoryQuestionnaire);
      
      render(
        <RAPIDQuestionnaireLoader
          assessmentType="EXPLORATORY"
          onQuestionsLoaded={mockOnQuestionsLoaded}
          onError={mockOnError}
        />
      );

      jest.advanceTimersByTime(500);
      
      await waitFor(() => {
        // Check for formatted date (format may vary by locale)
        expect(screen.getByText(/1\/6\/2025|6\/1\/2025/)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle questionnaire loading failure', async () => {
      mockGetRAPIDQuestionnaire.mockReturnValue(null as any);
      
      render(
        <RAPIDQuestionnaireLoader
          assessmentType="EXPLORATORY"
          onQuestionsLoaded={mockOnQuestionsLoaded}
          onError={mockOnError}
        />
      );

      jest.advanceTimersByTime(500);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to Load Questionnaire')).toBeInTheDocument();
        expect(screen.getByText(/Failed to load questionnaire for type: EXPLORATORY/)).toBeInTheDocument();
      });

      expect(mockOnError).toHaveBeenCalledWith('Failed to load questionnaire for type: EXPLORATORY');
      expect(mockOnQuestionsLoaded).not.toHaveBeenCalled();
    });

    it('should handle null questionnaire data', async () => {
      mockGetRAPIDQuestionnaire.mockReturnValue(null as any);
      
      render(
        <RAPIDQuestionnaireLoader
          assessmentType="MIGRATION"
          onQuestionsLoaded={mockOnQuestionsLoaded}
          onError={mockOnError}
        />
      );

      jest.advanceTimersByTime(500);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to Load Questionnaire')).toBeInTheDocument();
      });
    });

    it('should provide retry functionality on error', async () => {
      mockGetRAPIDQuestionnaire.mockReturnValue(null as any);
      
      // Mock window.location.reload
      const mockReload = jest.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true
      });
      
      render(
        <RAPIDQuestionnaireLoader
          assessmentType="EXPLORATORY"
          onQuestionsLoaded={mockOnQuestionsLoaded}
          onError={mockOnError}
        />
      );

      jest.advanceTimersByTime(500);
      
      await waitFor(() => {
        const retryButton = screen.getByText('Try Again');
        expect(retryButton).toBeInTheDocument();
      });
    });
  });

  describe('Component Lifecycle', () => {
    it('should reload questionnaire when assessment type changes', async () => {
      mockGetRAPIDQuestionnaire
        .mockReturnValueOnce(mockExploratoryQuestionnaire)
        .mockReturnValueOnce(mockMigrationQuestionnaire);
      
      const { rerender } = render(
        <RAPIDQuestionnaireLoader
          assessmentType="EXPLORATORY"
          onQuestionsLoaded={mockOnQuestionsLoaded}
          onError={mockOnError}
        />
      );

      jest.advanceTimersByTime(500);
      
      await waitFor(() => {
        expect(screen.getByText('New GenAI Development')).toBeInTheDocument();
      });

      // Change assessment type
      rerender(
        <RAPIDQuestionnaireLoader
          assessmentType="MIGRATION"
          onQuestionsLoaded={mockOnQuestionsLoaded}
          onError={mockOnError}
        />
      );

      jest.advanceTimersByTime(500);
      
      await waitFor(() => {
        expect(screen.getByText('GenAI Migration to AWS')).toBeInTheDocument();
      });

      expect(mockGetRAPIDQuestionnaire).toHaveBeenCalledTimes(2);
      expect(mockGetRAPIDQuestionnaire).toHaveBeenNthCalledWith(1, 'EXPLORATORY');
      expect(mockGetRAPIDQuestionnaire).toHaveBeenNthCalledWith(2, 'MIGRATION');
    });

    it('should call onQuestionsLoaded callback with correct data', async () => {
      mockGetRAPIDQuestionnaire.mockReturnValue(mockExploratoryQuestionnaire);
      
      render(
        <RAPIDQuestionnaireLoader
          assessmentType="EXPLORATORY"
          onQuestionsLoaded={mockOnQuestionsLoaded}
          onError={mockOnError}
        />
      );

      jest.advanceTimersByTime(500);
      
      await waitFor(() => {
        expect(mockOnQuestionsLoaded).toHaveBeenCalledWith(mockExploratoryQuestionnaire);
      });
    });

    it('should handle missing onError callback gracefully', async () => {
      mockGetRAPIDQuestionnaire.mockReturnValue(null as any);
      
      expect(() => {
        render(
          <RAPIDQuestionnaireLoader
            assessmentType="EXPLORATORY"
            onQuestionsLoaded={mockOnQuestionsLoaded}
          />
        );
      }).not.toThrow();

      jest.advanceTimersByTime(500);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to Load Questionnaire')).toBeInTheDocument();
      });
    });
  });

  describe('UI Elements', () => {
    it('should display correct icons and styling', async () => {
      mockGetRAPIDQuestionnaire.mockReturnValue(mockExploratoryQuestionnaire);
      
      render(
        <RAPIDQuestionnaireLoader
          assessmentType="EXPLORATORY"
          onQuestionsLoaded={mockOnQuestionsLoaded}
          onError={mockOnError}
        />
      );

      jest.advanceTimersByTime(500);
      
      await waitFor(() => {
        const container = screen.getByText('RAPID Questionnaire Loaded').closest('.bg-blue-50');
        expect(container).toHaveClass('bg-blue-50', 'border', 'border-blue-200', 'rounded-lg');
      });
    });

    it('should display questionnaire metadata in grid layout', async () => {
      mockGetRAPIDQuestionnaire.mockReturnValue(mockExploratoryQuestionnaire);
      
      render(
        <RAPIDQuestionnaireLoader
          assessmentType="EXPLORATORY"
          onQuestionsLoaded={mockOnQuestionsLoaded}
          onError={mockOnError}
        />
      );

      jest.advanceTimersByTime(500);
      
      await waitFor(() => {
        expect(screen.getByText('Version:')).toBeInTheDocument();
        expect(screen.getByText('Total Questions:')).toBeInTheDocument();
        expect(screen.getAllByText('Categories:')[0]).toBeInTheDocument(); // First occurrence in metadata
        expect(screen.getByText('Last Updated:')).toBeInTheDocument();
      });
    });
  });
});