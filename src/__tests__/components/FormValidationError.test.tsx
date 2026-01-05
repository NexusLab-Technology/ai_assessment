import React from 'react'
import { render, screen } from '@testing-library/react'
import FormValidationError from '../../components/ai-assessment/FormValidationError'

describe('FormValidationError Component', () => {
  describe('Single Error', () => {
    it('renders single error message', () => {
      render(<FormValidationError error="This field is required" />)
      
      expect(screen.getByText('This field is required')).toBeInTheDocument()
      // Icon is present but hidden from screen readers
      const svg = document.querySelector('svg[aria-hidden="true"]')
      expect(svg).toBeInTheDocument()
    })

    it('does not render when no error provided', () => {
      const { container } = render(<FormValidationError />)
      
      expect(container.firstChild).toBeNull()
    })

    it('does not render when show is false', () => {
      const { container } = render(
        <FormValidationError error="Error message" show={false} />
      )
      
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Multiple Errors', () => {
    it('renders multiple error messages', () => {
      const errors = ['First error', 'Second error', 'Third error']
      
      render(<FormValidationError errors={errors} />)
      
      errors.forEach(error => {
        expect(screen.getByText(error)).toBeInTheDocument()
      })
      
      // Should have one icon per error
      const icons = document.querySelectorAll('svg[aria-hidden="true"]')
      expect(icons).toHaveLength(3)
    })

    it('does not render when errors array is empty', () => {
      const { container } = render(<FormValidationError errors={[]} />)
      
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Priority and Styling', () => {
    it('prioritizes errors array over single error', () => {
      const errors = ['Array error 1', 'Array error 2']
      
      render(
        <FormValidationError 
          error="Single error" 
          errors={errors} 
        />
      )
      
      // Should show array errors, not single error
      expect(screen.getByText('Array error 1')).toBeInTheDocument()
      expect(screen.getByText('Array error 2')).toBeInTheDocument()
      expect(screen.queryByText('Single error')).not.toBeInTheDocument()
    })

    it('applies custom className', () => {
      const { container } = render(
        <FormValidationError 
          error="Test error" 
          className="custom-class" 
        />
      )
      
      expect(container.firstChild).toHaveClass('custom-class')
    })

    it('applies default styling classes', () => {
      render(<FormValidationError error="Test error" />)
      
      const errorContainer = screen.getByText('Test error').parentElement
      expect(errorContainer).toHaveClass('text-sm', 'text-red-600')
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA structure', () => {
      render(<FormValidationError error="Validation error" />)
      
      const errorText = screen.getByText('Validation error')
      expect(errorText).toBeInTheDocument()
      
      // Icon should be decorative (hidden from screen readers)
      const icon = document.querySelector('svg[aria-hidden="true"]')
      expect(icon).toBeInTheDocument()
    })

    it('maintains semantic structure for multiple errors', () => {
      const errors = ['Error 1', 'Error 2']
      
      render(<FormValidationError errors={errors} />)
      
      errors.forEach(error => {
        const errorText = screen.getByText(error)
        expect(errorText).toBeInTheDocument()
      })
    })
  })
})