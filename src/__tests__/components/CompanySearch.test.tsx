import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import fc from 'fast-check'
import CompanySearch from '@/components/company-settings/CompanySearch'

describe('CompanySearch', () => {
  const mockOnSearch = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('Unit Tests', () => {
    it('should render search input with placeholder', () => {
      const placeholder = 'Search companies...'
      render(<CompanySearch onSearch={mockOnSearch} placeholder={placeholder} />)
      
      const input = screen.getByPlaceholderText(placeholder)
      expect(input).toBeInTheDocument()
    })

    it('should render search and clear icons', () => {
      render(<CompanySearch onSearch={mockOnSearch} />)
      
      // Search icon should be visible
      const searchIcon = screen.getByRole('textbox').parentElement?.querySelector('svg')
      expect(searchIcon).toBeInTheDocument()
    })

    it('should show clear button when there is text', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      render(<CompanySearch onSearch={mockOnSearch} />)
      
      const input = screen.getByRole('textbox')
      await user.type(input, 'test')
      
      const clearButton = screen.getByLabelText('Clear search')
      expect(clearButton).toBeInTheDocument()
    })

    it('should not show clear button when input is empty', () => {
      render(<CompanySearch onSearch={mockOnSearch} />)
      
      const clearButton = screen.queryByLabelText('Clear search')
      expect(clearButton).not.toBeInTheDocument()
    })

    it('should debounce search calls', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      render(<CompanySearch onSearch={mockOnSearch} debounceMs={300} />)
      
      const input = screen.getByRole('textbox')
      
      // Type multiple characters quickly
      await user.type(input, 'test')
      
      // Should not have called onSearch yet
      expect(mockOnSearch).not.toHaveBeenCalled()
      
      // Advance timers to trigger debounce
      jest.advanceTimersByTime(300)
      
      // Now should have called onSearch once with final value
      expect(mockOnSearch).toHaveBeenCalledTimes(1)
      expect(mockOnSearch).toHaveBeenCalledWith('test')
    })

    it('should clear search when clear button is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      render(<CompanySearch onSearch={mockOnSearch} />)
      
      const input = screen.getByRole('textbox')
      await user.type(input, 'test')
      
      jest.advanceTimersByTime(300)
      expect(mockOnSearch).toHaveBeenCalledWith('test')
      
      const clearButton = screen.getByLabelText('Clear search')
      await user.click(clearButton)
      
      expect(input).toHaveValue('')
      jest.advanceTimersByTime(300)
      expect(mockOnSearch).toHaveBeenCalledWith('')
    })

    it('should clear search when Escape key is pressed', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      render(<CompanySearch onSearch={mockOnSearch} />)
      
      const input = screen.getByRole('textbox')
      await user.type(input, 'test')
      
      jest.advanceTimersByTime(300)
      expect(mockOnSearch).toHaveBeenCalledWith('test')
      
      await user.type(input, '{Escape}')
      
      expect(input).toHaveValue('')
      jest.advanceTimersByTime(300)
      expect(mockOnSearch).toHaveBeenCalledWith('')
    })

    it('should show search status when debouncing', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      render(<CompanySearch onSearch={mockOnSearch} debounceMs={300} />)
      
      const input = screen.getByRole('textbox')
      await user.type(input, 'test')
      
      // Should show searching status
      expect(screen.getByText('Searching for "test"...')).toBeInTheDocument()
      
      // After debounce, status should disappear
      jest.advanceTimersByTime(300)
      await waitFor(() => {
        expect(screen.queryByText('Searching for "test"...')).not.toBeInTheDocument()
      })
    })
  })

  describe('Property-Based Tests', () => {
    /**
     * Feature: company-settings, Property 5: Search functionality correctness
     * For any search query, the search component should properly debounce and call onSearch
     * with the correct query value
     * Validates: Requirements 3.5
     */
    it('Property 5: Search functionality correctness - debouncing behavior', async () => {
      await fc.assert(fc.asyncProperty(
        fc.string({ maxLength: 100 }),
        fc.integer({ min: 100, max: 1000 }),
        async (searchQuery: string, debounceMs: number) => {
          const onSearch = jest.fn()
            const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
            
            render(<CompanySearch onSearch={onSearch} debounceMs={debounceMs} />)
            
            const input = screen.getByRole('textbox')
            await user.clear(input)
            await user.type(input, searchQuery)
            
            // Should not have called onSearch immediately
            expect(onSearch).not.toHaveBeenCalled()
            
            // Advance timers by debounce amount
            jest.advanceTimersByTime(debounceMs)
            
            // Should have called onSearch exactly once with the search query
            expect(onSearch).toHaveBeenCalledTimes(1)
            expect(onSearch).toHaveBeenCalledWith(searchQuery)
        }
      ), { numRuns: 20 })
    })

    it('should handle various input values correctly', async () => {
      await fc.assert(fc.asyncProperty(
        fc.string({ maxLength: 200 }),
        async (inputValue: string) => {
          const onSearch = jest.fn()
          const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
          
          render(<CompanySearch onSearch={onSearch} debounceMs={100} />)
          
          const input = screen.getByRole('textbox')
          await user.clear(input)
          await user.type(input, inputValue)
          
          // Check input value is set correctly
          expect(input).toHaveValue(inputValue)
          
          // Check clear button visibility
          if (inputValue.length > 0) {
            expect(screen.getByLabelText('Clear search')).toBeInTheDocument()
          } else {
            expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument()
          }
          
            // Advance timers and check onSearch call
            jest.advanceTimersByTime(100)
            expect(onSearch).toHaveBeenCalledWith(inputValue)
        }
      ), { numRuns: 30 })
    })

    it('should handle rapid typing correctly with debouncing', async () => {
      await fc.assert(fc.asyncProperty(
        fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 2, maxLength: 5 }),
        fc.integer({ min: 200, max: 500 }),
        async (typingSequence: string[], debounceMs: number) => {
          const onSearch = jest.fn()
          const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
          
          render(<CompanySearch onSearch={onSearch} debounceMs={debounceMs} />)
          
          const input = screen.getByRole('textbox')
          
          // Type each string in sequence rapidly
          for (const text of typingSequence) {
            await user.clear(input)
            await user.type(input, text)
            // Advance time by less than debounce to simulate rapid typing
            jest.advanceTimersByTime(debounceMs / 2)
          }
          
          // Should not have called onSearch during rapid typing
          expect(onSearch).toHaveBeenCalledTimes(0)
          
          // Advance by full debounce time
          jest.advanceTimersByTime(debounceMs)
          
            // Should have called onSearch once with the final value
            expect(onSearch).toHaveBeenCalledTimes(1)
            expect(onSearch).toHaveBeenCalledWith(typingSequence[typingSequence.length - 1])
        }
      ), { numRuns: 20 })
    })

    it('should maintain accessibility attributes correctly', () => {
      fc.assert(fc.property(
        fc.string({ maxLength: 100 }),
        (placeholder: string) => {
          render(<CompanySearch onSearch={mockOnSearch} placeholder={placeholder} />)
          
          const input = screen.getByRole('textbox')
          
          // Should have proper accessibility attributes
          expect(input).toHaveAttribute('aria-label', 'Search companies')
          if (placeholder) {
            expect(input).toHaveAttribute('placeholder', placeholder)
          }
          
          // Should be focusable
          expect(input).not.toHaveAttribute('disabled')
        }
      ), { numRuns: 20 })
    })
  })
})