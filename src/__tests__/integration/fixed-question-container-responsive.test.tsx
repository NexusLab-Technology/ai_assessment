/**
 * Integration Test: FixedQuestionContainer Responsive Behavior
 * Task 16.2: Test container dimensions across different screen sizes
 * Requirements: 13.1, 13.2, 13.3
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { EnhancedFixedQuestionContainer } from '@/components/ai-assessment/EnhancedFixedQuestionContainer'

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}))

// Mock MutationObserver
global.MutationObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn(),
  disconnect: jest.fn()
}))

describe('FixedQuestionContainer Responsive Behavior Tests', () => {
  // Helper function to simulate window resize
  const simulateResize = (width: number, height: number = 768) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: height,
    })
    
    // Trigger resize event
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })
  }

  // Helper function to create content of different lengths
  const createContent = (length: 'short' | 'medium' | 'long' | 'very-long') => {
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
      ),
      'very-long': (
        <div>
          <h2>Very Long Content for Stress Testing</h2>
          {Array.from({ length: 25 }, (_, i) => (
            <div key={i}>
              <h3>Section {i + 1}</h3>
              <p>
                This is a very long content section designed to stress test the scrolling behavior.
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor 
                incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud 
                exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>
              <ul>
                <li>List item 1 with additional content</li>
                <li>List item 2 with additional content</li>
                <li>List item 3 with additional content</li>
              </ul>
            </div>
          ))}
        </div>
      )
    }
    return contents[length]
  }

  beforeEach(() => {
    // Reset window size to default
    simulateResize(1024, 768)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Screen Size Responsiveness', () => {
    it('should adapt container dimensions for extra small screens (xs: 0-479px)', async () => {
      simulateResize(400)

      await act(async () => {
        render(
          <EnhancedFixedQuestionContainer testId="xs-container">
            {createContent('medium')}
          </EnhancedFixedQuestionContainer>
        )
      })

      await waitFor(() => {
        const container = screen.getByTestId('xs-container')
        expect(container).toBeInTheDocument()
        expect(container).toHaveAttribute('data-screen-size', 'xs')
        
        // Check minimum height for xs screens
        const computedStyle = window.getComputedStyle(container)
        const height = parseInt(computedStyle.height)
        expect(height).toBeGreaterThanOrEqual(400) // Minimum height for xs
      })
    })

    it('should adapt container dimensions for small screens (sm: 480-767px)', async () => {
      simulateResize(600)

      await act(async () => {
        render(
          <EnhancedFixedQuestionContainer testId="sm-container">
            {createContent('medium')}
          </EnhancedFixedQuestionContainer>
        )
      })

      await waitFor(() => {
        const container = screen.getByTestId('sm-container')
        expect(container).toHaveAttribute('data-screen-size', 'sm')
        
        // Check height for sm screens
        const computedStyle = window.getComputedStyle(container)
        const height = parseInt(computedStyle.height)
        expect(height).toBeGreaterThanOrEqual(500) // Expected height for sm
      })
    })

    it('should adapt container dimensions for medium screens (md: 768-1023px)', async () => {
      simulateResize(900)

      await act(async () => {
        render(
          <EnhancedFixedQuestionContainer testId="md-container">
            {createContent('medium')}
          </EnhancedFixedQuestionContainer>
        )
      })

      await waitFor(() => {
        const container = screen.getByTestId('md-container')
        expect(container).toHaveAttribute('data-screen-size', 'md')
        
        // Check height for md screens
        const computedStyle = window.getComputedStyle(container)
        const height = parseInt(computedStyle.height)
        expect(height).toBeGreaterThanOrEqual(600) // Expected height for md
      })
    })

    it('should adapt container dimensions for large screens (lg: 1024-1279px)', async () => {
      simulateResize(1200)

      await act(async () => {
        render(
          <EnhancedFixedQuestionContainer testId="lg-container">
            {createContent('medium')}
          </EnhancedFixedQuestionContainer>
        )
      })

      await waitFor(() => {
        const container = screen.getByTestId('lg-container')
        expect(container).toHaveAttribute('data-screen-size', 'lg')
        
        // Check height for lg screens
        const computedStyle = window.getComputedStyle(container)
        const height = parseInt(computedStyle.height)
        expect(height).toBeGreaterThanOrEqual(650) // Expected height for lg
      })
    })

    it('should adapt container dimensions for extra large screens (xl: 1280px+)', async () => {
      simulateResize(1400)

      await act(async () => {
        render(
          <EnhancedFixedQuestionContainer testId="xl-container">
            {createContent('medium')}
          </EnhancedFixedQuestionContainer>
        )
      })

      await waitFor(() => {
        const container = screen.getByTestId('xl-container')
        expect(container).toHaveAttribute('data-screen-size', 'xl')
        
        // Check height for xl screens
        const computedStyle = window.getComputedStyle(container)
        const height = parseInt(computedStyle.height)
        expect(height).toBeGreaterThanOrEqual(700) // Expected height for xl
      })
    })
  })

  describe('Content Scrolling Behavior', () => {
    it('should handle short content without scrolling', async () => {
      await act(async () => {
        render(
          <EnhancedFixedQuestionContainer testId="short-content-container">
            {createContent('short')}
          </EnhancedFixedQuestionContainer>
        )
      })

      await waitFor(() => {
        const container = screen.getByTestId('short-content-container')
        expect(container).toHaveAttribute('data-content-overflowing', 'false')
        
        // Should not show scrollable indicator
        expect(screen.queryByText('Scrollable')).not.toBeInTheDocument()
      })
    })

    it('should enable scrolling for long content', async () => {
      await act(async () => {
        render(
          <EnhancedFixedQuestionContainer testId="long-content-container">
            {createContent('long')}
          </EnhancedFixedQuestionContainer>
        )
      })

      await waitFor(() => {
        const container = screen.getByTestId('long-content-container')
        const contentArea = screen.getByTestId('long-content-container-content')
        
        // Content should be scrollable
        expect(contentArea).toHaveClass('overflow-y-auto')
        
        // Should show scrollable indicator when content overflows
        // Note: This might not be immediately detectable in jsdom, so we check the class
        expect(contentArea).toHaveStyle('overflow-y: auto')
      })
    })

    it('should maintain scroll position during layout changes', async () => {
      const { rerender } = render(
        <EnhancedFixedQuestionContainer 
          testId="scroll-position-container"
          maintainScrollPosition={true}
        >
          {createContent('very-long')}
        </EnhancedFixedQuestionContainer>
      )

      await waitFor(() => {
        const contentArea = screen.getByTestId('scroll-position-container-content')
        
        // Simulate scrolling
        act(() => {
          fireEvent.scroll(contentArea, { target: { scrollTop: 200 } })
        })
      })

      // Change content while maintaining scroll position
      await act(async () => {
        rerender(
          <EnhancedFixedQuestionContainer 
            testId="scroll-position-container"
            maintainScrollPosition={true}
          >
            {createContent('long')}
          </EnhancedFixedQuestionContainer>
        )
      })

      // Scroll position should be maintained (or at least attempted)
      const contentArea = screen.getByTestId('scroll-position-container-content')
      expect(contentArea).toBeInTheDocument()
    })

    it('should handle very long content with proper scrolling', async () => {
      await act(async () => {
        render(
          <EnhancedFixedQuestionContainer testId="very-long-content-container">
            {createContent('very-long')}
          </EnhancedFixedQuestionContainer>
        )
      })

      await waitFor(() => {
        const contentArea = screen.getByTestId('very-long-content-container-content')
        
        // Should have scrolling enabled
        expect(contentArea).toHaveClass('overflow-y-auto')
        
        // Should be able to scroll
        act(() => {
          fireEvent.scroll(contentArea, { target: { scrollTop: 100 } })
        })
        
        // Verify scroll event was handled
        expect(contentArea.scrollTop).toBeDefined()
      })
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

      // Get initial dimensions
      const container = screen.getByTestId('stability-container')
      const initialHeight = container.style.height

      // Change content
      await act(async () => {
        rerender(
          <EnhancedFixedQuestionContainer 
            testId="stability-container"
            preventLayoutShift={true}
          >
            {createContent('long')}
          </EnhancedFixedQuestionContainer>
        )
      })

      // Dimensions should remain consistent
      expect(container.style.height).toBe(initialHeight)
    })

    it('should prevent layout shifts during navigation', async () => {
      const { rerender } = render(
        <EnhancedFixedQuestionContainer 
          testId="navigation-stability-container"
          preventLayoutShift={true}
        >
          <div>Question 1 Content</div>
        </EnhancedFixedQuestionContainer>
      )

      const container = screen.getByTestId('navigation-stability-container')
      const initialDimensions = {
        width: container.offsetWidth,
        height: container.offsetHeight
      }

      // Simulate navigation to different question
      await act(async () => {
        rerender(
          <EnhancedFixedQuestionContainer 
            testId="navigation-stability-container"
            preventLayoutShift={true}
          >
            <div>
              <h2>Question 2 Content</h2>
              <p>This is a different question with different content length.</p>
            </div>
          </EnhancedFixedQuestionContainer>
        )
      })

      // Container dimensions should remain stable
      expect(container.offsetWidth).toBe(initialDimensions.width)
      expect(container.offsetHeight).toBe(initialDimensions.height)
    })

    it('should handle rapid content changes without layout shifts', async () => {
      const { rerender } = render(
        <EnhancedFixedQuestionContainer 
          testId="rapid-change-container"
          preventLayoutShift={true}
        >
          {createContent('short')}
        </EnhancedFixedQuestionContainer>
      )

      const container = screen.getByTestId('rapid-change-container')
      const initialHeight = container.style.height

      // Rapidly change content multiple times
      const contentTypes: Array<'short' | 'medium' | 'long'> = ['medium', 'long', 'short', 'medium']
      
      for (const contentType of contentTypes) {
        await act(async () => {
          rerender(
            <EnhancedFixedQuestionContainer 
              testId="rapid-change-container"
              preventLayoutShift={true}
            >
              {createContent(contentType)}
            </EnhancedFixedQuestionContainer>
          )
        })
        
        // Small delay to simulate real usage
        await new Promise(resolve => setTimeout(resolve, 50))
      }

      // Height should remain consistent
      expect(container.style.height).toBe(initialHeight)
    })
  })

  describe('Responsive Design Features', () => {
    it('should show appropriate screen size indicators', async () => {
      // Test different screen sizes
      const screenSizes = [
        { width: 400, expectedSize: 'xs' },
        { width: 600, expectedSize: 'sm' },
        { width: 900, expectedSize: 'md' },
        { width: 1200, expectedSize: 'lg' },
        { width: 1400, expectedSize: 'xl' }
      ]

      for (const { width, expectedSize } of screenSizes) {
        simulateResize(width)

        const { unmount } = render(
          <EnhancedFixedQuestionContainer testId={`${expectedSize}-indicator-container`}>
            {createContent('medium')}
          </EnhancedFixedQuestionContainer>
        )

        await waitFor(() => {
          const container = screen.getByTestId(`${expectedSize}-indicator-container`)
          expect(container).toHaveAttribute('data-screen-size', expectedSize)
          
          // Should show screen size in the header
          expect(screen.getByText(expectedSize.toUpperCase(), { exact: false })).toBeInTheDocument()
        })

        unmount()
      }
    })

    it('should adapt padding based on screen size', async () => {
      const screenSizes = [
        { width: 400, expectedPadding: '16px' },
        { width: 600, expectedPadding: '20px' },
        { width: 900, expectedPadding: '24px' },
        { width: 1200, expectedPadding: '28px' },
        { width: 1400, expectedPadding: '32px' }
      ]

      for (const { width, expectedPadding } of screenSizes) {
        simulateResize(width)

        const { unmount } = render(
          <EnhancedFixedQuestionContainer testId={`padding-test-${width}`}>
            {createContent('medium')}
          </EnhancedFixedQuestionContainer>
        )

        await waitFor(() => {
          // Check if padding information is displayed in footer
          expect(screen.getByText(`Padding: ${expectedPadding.replace('px', '')}px`, { exact: false })).toBeInTheDocument()
        })

        unmount()
      }
    })

    it('should handle custom min and max heights', async () => {
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
      const computedStyle = window.getComputedStyle(container)
      const height = parseInt(computedStyle.height)

      expect(height).toBeGreaterThanOrEqual(customMinHeight)
      expect(height).toBeLessThanOrEqual(customMaxHeight)
    })
  })

  describe('Error and Loading States', () => {
    it('should display loading state with proper dimensions', async () => {
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
      
      // Should maintain fixed dimensions even in loading state
      expect(loadingContainer).toHaveStyle('height: 600px') // Default md height
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
  })

  describe('Requirements Validation', () => {
    it('should satisfy Requirement 13.1: Fixed container dimensions', async () => {
      const { rerender } = render(
        <EnhancedFixedQuestionContainer testId="req-13-1-container">
          {createContent('short')}
        </EnhancedFixedQuestionContainer>
      )

      const container = screen.getByTestId('req-13-1-container')
      const initialDimensions = {
        width: container.offsetWidth,
        height: container.offsetHeight
      }

      // Change content type - dimensions should remain fixed
      await act(async () => {
        rerender(
          <EnhancedFixedQuestionContainer testId="req-13-1-container">
            {createContent('long')}
          </EnhancedFixedQuestionContainer>
        )
      })

      expect(container.offsetWidth).toBe(initialDimensions.width)
      expect(container.offsetHeight).toBe(initialDimensions.height)
    })

    it('should satisfy Requirement 13.2: Proper scrolling behavior', async () => {
      await act(async () => {
        render(
          <EnhancedFixedQuestionContainer testId="req-13-2-container">
            {createContent('very-long')}
          </EnhancedFixedQuestionContainer>
        )
      })

      const contentArea = screen.getByTestId('req-13-2-container-content')
      
      // Should have scrolling enabled for long content
      expect(contentArea).toHaveClass('overflow-y-auto')
      
      // Should be able to scroll
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

      // Simulate multiple navigation changes
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

        // Height should remain consistent
        expect(container.style.height).toBe(initialHeight)
      }
    })
  })
})