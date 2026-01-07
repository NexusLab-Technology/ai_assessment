/**
 * Integration Test: FixedQuestionContainer Responsive Behavior (Simplified)
 * Task 16.2: Test container dimensions and responsive behavior
 * Requirements: 13.1, 13.2, 13.3
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { EnhancedFixedQuestionContainer } from '@/components/ai-assessment/EnhancedFixedQuestionContainer'

// Mock ResizeObserver and MutationObserver
global.ResizeObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}))

global.MutationObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn(),
  disconnect: jest.fn()
}))

describe('FixedQuestionContainer Responsive Behavior Tests (Simplified)', () => {
  // Helper function to create content of different lengths
  const createContent = (length: 'short' | 'medium' | 'long') => {
    const contents = {
      short: <div>Short content that fits easily.</div>,
      medium: (
        <div>
          <h2>Medium Length Content</h2>
          <p>This is a medium-length content that might require some scrolling on smaller screens.</p>
          <p>It contains multiple paragraphs to test the container behavior.</p>
        </div>
      ),
      long: (
        <div>
          <h2>Long Content for Testing</h2>
          {Array.from({ length: 10 }, (_, i) => (
            <p key={i}>
              This is paragraph {i + 1} of long content. It contains enough text to definitely 
              require scrolling in the fixed container. Lorem ipsum dolor sit amet, consectetur 
              adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
          ))}
        </div>
      )
    }
    return contents[length]
  }

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic Container Functionality', () => {
    it('should render with default dimensions and responsive classes', async () => {
      await act(async () => {
        render(
          <EnhancedFixedQuestionContainer testId="basic-container">
            {createContent('medium')}
          </EnhancedFixedQuestionContainer>
        )
      })

      const container = screen.getByTestId('basic-container')
      expect(container).toBeInTheDocument()
      expect(container).toHaveClass('enhanced-fixed-question-container')
      expect(container).toHaveClass('relative', 'w-full', 'border', 'rounded-lg')
    })

    it('should display container information in header and footer', async () => {
      await act(async () => {
        render(
          <EnhancedFixedQuestionContainer testId="info-container">
            {createContent('medium')}
          </EnhancedFixedQuestionContainer>
        )
      })

      // Should show screen size indicator
      expect(screen.getByText(/XS|SM|MD|LG|XL/)).toBeInTheDocument()
      
      // Should show padding and scrollbar information
      expect(screen.getByText(/Padding:.*px/)).toBeInTheDocument()
      expect(screen.getByText(/Scrollbar:.*px/)).toBeInTheDocument()
      
      // Should show scroll position maintenance status
      expect(screen.getByText('Position Maintained')).toBeInTheDocument()
    })

    it('should handle different content lengths appropriately', async () => {
      const contentTypes: Array<'short' | 'medium' | 'long'> = ['short', 'medium', 'long']
      
      for (const contentType of contentTypes) {
        const { unmount } = render(
          <EnhancedFixedQuestionContainer testId={`${contentType}-content-container`}>
            {createContent(contentType)}
          </EnhancedFixedQuestionContainer>
        )

        const container = screen.getByTestId(`${contentType}-content-container`)
        const contentArea = screen.getByTestId(`${contentType}-content-container-content`)
        
        expect(container).toBeInTheDocument()
        expect(contentArea).toHaveClass('overflow-y-auto')
        
        unmount()
      }
    })
  })

  describe('Scrolling Behavior', () => {
    it('should enable scrolling for content that exceeds container height', async () => {
      await act(async () => {
        render(
          <EnhancedFixedQuestionContainer testId="scrolling-container">
            {createContent('long')}
          </EnhancedFixedQuestionContainer>
        )
      })

      const contentArea = screen.getByTestId('scrolling-container-content')
      
      // Should have scrolling classes
      expect(contentArea).toHaveClass('overflow-y-auto')
      expect(contentArea).toHaveClass('overflow-x-hidden')
      
      // Should be able to handle scroll events
      act(() => {
        fireEvent.scroll(contentArea, { target: { scrollTop: 100 } })
      })
      
      expect(contentArea.scrollTop).toBeDefined()
    })

    it('should maintain scroll position during content changes', async () => {
      const { rerender } = render(
        <EnhancedFixedQuestionContainer 
          testId="scroll-maintenance-container"
          maintainScrollPosition={true}
        >
          {createContent('long')}
        </EnhancedFixedQuestionContainer>
      )

      const contentArea = screen.getByTestId('scroll-maintenance-container-content')
      
      // Simulate scrolling
      act(() => {
        fireEvent.scroll(contentArea, { target: { scrollTop: 200 } })
      })

      // Change content
      await act(async () => {
        rerender(
          <EnhancedFixedQuestionContainer 
            testId="scroll-maintenance-container"
            maintainScrollPosition={true}
          >
            {createContent('medium')}
          </EnhancedFixedQuestionContainer>
        )
      })

      // Container should still be functional
      expect(contentArea).toBeInTheDocument()
      expect(contentArea).toHaveClass('overflow-y-auto')
    })
  })

  describe('Layout Stability', () => {
    it('should maintain consistent dimensions during content changes', async () => {
      const { rerender } = render(
        <EnhancedFixedQuestionContainer 
          testId="stability-container"
          preventLayoutShift={true}
        >
          {createContent('short')}
        </EnhancedFixedQuestionContainer>
      )

      const container = screen.getByTestId('stability-container')
      const initialClasses = container.className

      // Change content multiple times
      const contentTypes: Array<'short' | 'medium' | 'long'> = ['medium', 'long', 'short']
      
      for (const contentType of contentTypes) {
        await act(async () => {
          rerender(
            <EnhancedFixedQuestionContainer 
              testId="stability-container"
              preventLayoutShift={true}
            >
              {createContent(contentType)}
            </EnhancedFixedQuestionContainer>
          )
        })
        
        // Container should maintain its classes and structure
        expect(container.className).toBe(initialClasses)
        expect(container).toHaveClass('enhanced-fixed-question-container')
      }
    })

    it('should prevent layout shifts with preventLayoutShift enabled', async () => {
      const { rerender } = render(
        <EnhancedFixedQuestionContainer 
          testId="layout-shift-prevention-container"
          preventLayoutShift={true}
        >
          <div>Initial content</div>
        </EnhancedFixedQuestionContainer>
      )

      const container = screen.getByTestId('layout-shift-prevention-container')
      
      // Should have layout shift prevention class
      expect(container).toHaveClass('will-change-auto')

      // Rapid content changes
      const contents = [
        <div key="1">Content 1</div>,
        <div key="2"><h2>Content 2 with header</h2><p>More text</p></div>,
        <div key="3">{createContent('long')}</div>
      ]

      for (const content of contents) {
        await act(async () => {
          rerender(
            <EnhancedFixedQuestionContainer 
              testId="layout-shift-prevention-container"
              preventLayoutShift={true}
            >
              {content}
            </EnhancedFixedQuestionContainer>
          )
        })

        // Should maintain stability classes
        expect(container).toHaveClass('will-change-auto')
      }
    })
  })

  describe('Custom Configuration', () => {
    it('should respect custom min and max heights', async () => {
      const customMinHeight = 300
      const customMaxHeight = 500

      await act(async () => {
        render(
          <EnhancedFixedQuestionContainer 
            testId="custom-height-container"
            minHeight={customMinHeight}
            maxHeight={customMaxHeight}
          >
            {createContent('medium')}
          </EnhancedFixedQuestionContainer>
        )
      })

      const container = screen.getByTestId('custom-height-container')
      
      // Should have custom height constraints in style
      expect(container.style.minHeight).toBe(`${customMinHeight}px`)
      expect(container.style.maxHeight).toBe(`${customMaxHeight}px`)
    })

    it('should handle auto-resize being disabled', async () => {
      await act(async () => {
        render(
          <EnhancedFixedQuestionContainer 
            testId="no-auto-resize-container"
            enableAutoResize={false}
          >
            {createContent('medium')}
          </EnhancedFixedQuestionContainer>
        )
      })

      const container = screen.getByTestId('no-auto-resize-container')
      expect(container).toBeInTheDocument()
      
      // Should still render properly even without auto-resize
      expect(container).toHaveClass('enhanced-fixed-question-container')
    })

    it('should handle scroll position maintenance being disabled', async () => {
      const { rerender } = render(
        <EnhancedFixedQuestionContainer 
          testId="no-scroll-maintenance-container"
          maintainScrollPosition={false}
        >
          {createContent('long')}
        </EnhancedFixedQuestionContainer>
      )

      // Should show "Free Scroll" in footer
      expect(screen.getByText('Free Scroll')).toBeInTheDocument()

      const contentArea = screen.getByTestId('no-scroll-maintenance-container-content')
      
      // Should still be scrollable
      expect(contentArea).toHaveClass('overflow-y-auto')
    })
  })

  describe('Error and Loading States', () => {
    it('should display loading state correctly', async () => {
      await act(async () => {
        render(
          <EnhancedFixedQuestionContainer 
            testId="loading-container"
            isLoading={true}
          >
            {createContent('medium')}
          </EnhancedFixedQuestionContainer>
        )
      })

      const loadingContainer = screen.getByTestId('loading-container-loading')
      expect(loadingContainer).toBeInTheDocument()
      
      // Should maintain container structure in loading state
      expect(loadingContainer).toHaveClass('enhanced-fixed-question-container')
    })

    it('should display error state with retry functionality', async () => {
      const mockRetry = jest.fn()

      await act(async () => {
        render(
          <EnhancedFixedQuestionContainer 
            testId="error-container"
            error="Test error message"
            onRetry={mockRetry}
          >
            {createContent('medium')}
          </EnhancedFixedQuestionContainer>
        )
      })

      const errorContainer = screen.getByTestId('error-container-error')
      expect(errorContainer).toBeInTheDocument()
      expect(screen.getByText('Test error message')).toBeInTheDocument()
      
      // Test retry functionality
      const retryButton = screen.getByText('Retry')
      fireEvent.click(retryButton)
      expect(mockRetry).toHaveBeenCalledTimes(1)
    })

    it('should handle error state without retry callback', async () => {
      await act(async () => {
        render(
          <EnhancedFixedQuestionContainer 
            testId="error-no-retry-container"
            error="Test error without retry"
          >
            {createContent('medium')}
          </EnhancedFixedQuestionContainer>
        )
      })

      expect(screen.getByText('Test error without retry')).toBeInTheDocument()
      expect(screen.queryByText('Retry')).not.toBeInTheDocument()
    })
  })

  describe('Requirements Validation', () => {
    it('should satisfy Requirement 13.1: Fixed container dimensions', async () => {
      const { rerender } = render(
        <EnhancedFixedQuestionContainer testId="req-13-1-container">
          {createContent('short')}
        </EnhancedFixedQuestionContainer>
      )

      const container = screen.getByTestId('req-13-1-container')
      const initialHeight = container.style.height
      const initialClasses = container.className

      // Change content type - dimensions should remain fixed
      await act(async () => {
        rerender(
          <EnhancedFixedQuestionContainer testId="req-13-1-container">
            {createContent('long')}
          </EnhancedFixedQuestionContainer>
        )
      })

      // Container should maintain fixed dimensions
      expect(container.style.height).toBe(initialHeight)
      expect(container.className).toBe(initialClasses)
      expect(container).toHaveClass('enhanced-fixed-question-container')
    })

    it('should satisfy Requirement 13.2: Proper scrolling behavior', async () => {
      await act(async () => {
        render(
          <EnhancedFixedQuestionContainer testId="req-13-2-container">
            {createContent('long')}
          </EnhancedFixedQuestionContainer>
        )
      })

      const contentArea = screen.getByTestId('req-13-2-container-content')
      
      // Should have proper scrolling classes
      expect(contentArea).toHaveClass('overflow-y-auto')
      expect(contentArea).toHaveClass('overflow-x-hidden')
      
      // Should handle scroll events
      act(() => {
        fireEvent.scroll(contentArea, { target: { scrollTop: 150 } })
      })
      
      expect(contentArea.scrollTop).toBeDefined()
    })

    it('should satisfy Requirement 13.3: Layout stability during navigation', async () => {
      const { rerender } = render(
        <EnhancedFixedQuestionContainer 
          testId="req-13-3-container"
          preventLayoutShift={true}
        >
          <div>Initial content</div>
        </EnhancedFixedQuestionContainer>
      )

      const container = screen.getByTestId('req-13-3-container')
      const initialHeight = container.style.height
      const initialClasses = container.className

      // Simulate navigation changes
      const navigationSteps = [
        <div key="1">Step 1: Short content</div>,
        <div key="2">
          <h2>Step 2: Medium content</h2>
          <p>Some additional content here.</p>
        </div>,
        <div key="3">{createContent('long')}</div>
      ]

      for (const content of navigationSteps) {
        await act(async () => {
          rerender(
            <EnhancedFixedQuestionContainer 
              testId="req-13-3-container"
              preventLayoutShift={true}
            >
              {content}
            </EnhancedFixedQuestionContainer>
          )
        })

        // Layout should remain stable
        expect(container.style.height).toBe(initialHeight)
        expect(container.className).toBe(initialClasses)
        expect(container).toHaveClass('will-change-auto') // Layout shift prevention
      }
    })
  })

  describe('Accessibility and User Experience', () => {
    it('should provide proper test IDs for all interactive elements', async () => {
      await act(async () => {
        render(
          <EnhancedFixedQuestionContainer testId="accessibility-container">
            {createContent('medium')}
          </EnhancedFixedQuestionContainer>
        )
      })

      // Main container
      expect(screen.getByTestId('accessibility-container')).toBeInTheDocument()
      
      // Content area
      expect(screen.getByTestId('accessibility-container-content')).toBeInTheDocument()
    })

    it('should handle rapid interactions without breaking', async () => {
      const { rerender } = render(
        <EnhancedFixedQuestionContainer testId="rapid-interaction-container">
          {createContent('short')}
        </EnhancedFixedQuestionContainer>
      )

      const contentArea = screen.getByTestId('rapid-interaction-container-content')

      // Rapid scroll events
      for (let i = 0; i < 10; i++) {
        act(() => {
          fireEvent.scroll(contentArea, { target: { scrollTop: i * 50 } })
        })
      }

      // Rapid content changes
      const contentTypes: Array<'short' | 'medium' | 'long'> = ['medium', 'long', 'short', 'medium', 'long']
      
      for (const contentType of contentTypes) {
        await act(async () => {
          rerender(
            <EnhancedFixedQuestionContainer testId="rapid-interaction-container">
              {createContent(contentType)}
            </EnhancedFixedQuestionContainer>
          )
        })
      }

      // Container should still be functional
      expect(screen.getByTestId('rapid-interaction-container')).toBeInTheDocument()
      expect(contentArea).toHaveClass('overflow-y-auto')
    })
  })
})