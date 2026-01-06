/**
 * Property-based tests for SubSidebar component
 * Feature: ai-assessment, Property 1: Sub-sidebar active state consistency
 * Validates: Requirements 1.3
 */

import React from 'react'
import { render, fireEvent, cleanup } from '@testing-library/react'
import { usePathname } from 'next/navigation'
import * as fc from 'fast-check'
import SubSidebar from '../../components/ai-assessment/SubSidebar'

// Mock Next.js hooks
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}))

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href, onClick, className }: any) => (
    <a href={href} onClick={onClick} className={className}>
      {children}
    </a>
  )
})

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>

describe('SubSidebar Component', () => {
  const mockOnModuleChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    cleanup()
  })

  afterEach(() => {
    cleanup()
  })

  describe('Property 1: Sub-sidebar active state consistency', () => {
    it('should highlight AI Assessment menu item when on assessment-related pages', () => {
      const assessmentPaths = [
        '/ai-assessment',
        '/ai-assessment/dashboard',
        '/ai-assessment/create',
        '/ai-assessment/assessment-123',
        '/ai-assessment/assessment-123/step/1',
        '/ai-assessment/assessment-123/report'
      ]

      assessmentPaths.forEach(pathname => {
        cleanup()
        mockUsePathname.mockReturnValue(pathname)

        const { container } = render(
          <SubSidebar 
            activeModule="ai-assessment"
            onModuleChange={mockOnModuleChange}
          />
        )

        // Find AI Assessment link by href
        const aiAssessmentLink = container.querySelector('a[href="/ai-assessment"]')
        expect(aiAssessmentLink).toHaveClass('bg-blue-100 text-blue-700')
        expect(aiAssessmentLink).toHaveClass('border-r-2 border-blue-700')
        
        // Should have active indicator dot
        const activeIndicator = aiAssessmentLink?.querySelector('.bg-blue-500.rounded-full')
        expect(activeIndicator).toBeInTheDocument()
      })
    })

    it('should highlight Company Settings menu item when on company settings pages', () => {
      const companyPaths = [
        '/company-settings',
        '/company-settings/create',
        '/company-settings/edit/123',
        '/company-settings/dashboard'
      ]

      companyPaths.forEach(pathname => {
        cleanup()
        mockUsePathname.mockReturnValue(pathname)

        const { container } = render(
          <SubSidebar 
            activeModule="company-settings"
            onModuleChange={mockOnModuleChange}
          />
        )

        // Find Company Settings link by href
        const companySettingsLink = container.querySelector('a[href="/company-settings"]')
        expect(companySettingsLink).toHaveClass('bg-blue-100 text-blue-700')
        expect(companySettingsLink).toHaveClass('border-r-2 border-blue-700')
        
        // Should have active indicator dot
        const activeIndicator = companySettingsLink?.querySelector('.bg-blue-500.rounded-full')
        expect(activeIndicator).toBeInTheDocument()
      })
    })

    it('should maintain consistent active state based on pathname', () => {
      fc.assert(fc.property(
        fc.constantFrom('/ai-assessment', '/company-settings', '/other-page'),
        fc.constantFrom('ai-assessment', 'company-settings', 'different-module'),
        (pathname: string, activeModule: string) => {
          cleanup()
          mockUsePathname.mockReturnValue(pathname)

          const { container } = render(
            <SubSidebar 
              activeModule={activeModule}
              onModuleChange={mockOnModuleChange}
            />
          )

          const aiAssessmentLink = container.querySelector('a[href="/ai-assessment"]')
          const companySettingsLink = container.querySelector('a[href="/company-settings"]')

          // Property: pathname should take precedence over activeModule prop
          if (pathname.startsWith('/ai-assessment')) {
            expect(aiAssessmentLink).toHaveClass('bg-blue-100 text-blue-700')
            expect(companySettingsLink).not.toHaveClass('bg-blue-100 text-blue-700')
          } else if (pathname.startsWith('/company-settings')) {
            expect(companySettingsLink).toHaveClass('bg-blue-100 text-blue-700')
            expect(aiAssessmentLink).not.toHaveClass('bg-blue-100 text-blue-700')
          }

          return true
        }
      ), { numRuns: 20 })
    })

    it('should handle mobile menu toggle correctly', () => {
      mockUsePathname.mockReturnValue('/ai-assessment')

      const { container } = render(
        <SubSidebar 
          activeModule="ai-assessment"
          onModuleChange={mockOnModuleChange}
        />
      )

      // Find mobile menu button by class
      const mobileMenuButton = container.querySelector('.lg\\:hidden button')
      expect(mobileMenuButton).toBeInTheDocument()

      // Initially, mobile menu should be closed
      const sidebar = container.querySelector('.fixed.inset-y-0.left-0')
      expect(sidebar).toHaveClass('-translate-x-full')

      // Click to open mobile menu
      fireEvent.click(mobileMenuButton!)

      // Mobile menu should be open
      expect(sidebar).toHaveClass('translate-x-0')
      expect(sidebar).not.toHaveClass('-translate-x-full')
    })

    it('should call onModuleChange when menu item is clicked', () => {
      mockUsePathname.mockReturnValue('/ai-assessment')
      const mockCallback = jest.fn()

      const { container } = render(
        <SubSidebar 
          activeModule="ai-assessment"
          onModuleChange={mockCallback}
        />
      )

      // Click on Company Settings
      const companySettingsLink = container.querySelector('a[href="/company-settings"]')
      fireEvent.click(companySettingsLink!)

      // Property: onModuleChange should be called with correct module ID
      expect(mockCallback).toHaveBeenCalledWith('company-settings')

      // Click on AI Assessment
      const aiAssessmentLink = container.querySelector('a[href="/ai-assessment"]')
      fireEvent.click(aiAssessmentLink!)

      expect(mockCallback).toHaveBeenCalledWith('ai-assessment')
    })
  })

  describe('Responsive Design Tests', () => {
    it('should render mobile menu button on mobile screens', () => {
      mockUsePathname.mockReturnValue('/ai-assessment')

      const { container } = render(
        <SubSidebar 
          activeModule="ai-assessment"
          onModuleChange={mockOnModuleChange}
        />
      )

      // Mobile menu button should be present
      const mobileMenuButton = container.querySelector('.lg\\:hidden button')
      expect(mobileMenuButton).toBeInTheDocument()
    })

    it('should render all menu items with correct structure', () => {
      mockUsePathname.mockReturnValue('/ai-assessment')

      const { container } = render(
        <SubSidebar 
          activeModule="ai-assessment"
          onModuleChange={mockOnModuleChange}
        />
      )

      // Both menu items should be present
      const aiAssessmentLink = container.querySelector('a[href="/ai-assessment"]')
      const companySettingsLink = container.querySelector('a[href="/company-settings"]')
      
      expect(aiAssessmentLink).toBeInTheDocument()
      expect(companySettingsLink).toBeInTheDocument()

      // Should have proper navigation structure
      const nav = container.querySelector('nav')
      expect(nav).toBeInTheDocument()

      // Should have icons for each menu item
      expect(aiAssessmentLink?.querySelector('svg')).toBeInTheDocument()
      expect(companySettingsLink?.querySelector('svg')).toBeInTheDocument()
    })
  })

  describe('Accessibility Tests', () => {
    it('should have proper ARIA attributes', () => {
      mockUsePathname.mockReturnValue('/ai-assessment')

      const { container } = render(
        <SubSidebar 
          activeModule="ai-assessment"
          onModuleChange={mockOnModuleChange}
        />
      )

      // Mobile menu button should have proper ARIA attributes
      const mobileMenuButton = container.querySelector('.lg\\:hidden button')
      expect(mobileMenuButton).toHaveAttribute('aria-expanded', 'false')

      // Icons should be hidden from screen readers
      const icons = container.querySelectorAll('svg[aria-hidden="true"]')
      expect(icons.length).toBeGreaterThan(0)
    })

    it('should support keyboard navigation', () => {
      mockUsePathname.mockReturnValue('/ai-assessment')

      const { container } = render(
        <SubSidebar 
          activeModule="ai-assessment"
          onModuleChange={mockOnModuleChange}
        />
      )

      // Menu items should be focusable
      const aiAssessmentLink = container.querySelector('a[href="/ai-assessment"]')
      const companySettingsLink = container.querySelector('a[href="/company-settings"]')

      expect(aiAssessmentLink).toHaveAttribute('href')
      expect(companySettingsLink).toHaveAttribute('href')
    })
  })

  describe('Property-Based Tests', () => {
    it('should maintain active state consistency across different pathnames', () => {
      fc.assert(fc.property(
        fc.constantFrom(
          '/ai-assessment',
          '/ai-assessment/dashboard', 
          '/company-settings',
          '/company-settings/create',
          '/other-page'
        ),
        (pathname: string) => {
          cleanup()
          mockUsePathname.mockReturnValue(pathname)

          const { container } = render(
            <SubSidebar 
              activeModule="ai-assessment"
              onModuleChange={mockOnModuleChange}
            />
          )

          const aiAssessmentLink = container.querySelector('a[href="/ai-assessment"]')
          const companySettingsLink = container.querySelector('a[href="/company-settings"]')

          // Property: Only one menu item should be active at a time
          const aiActive = aiAssessmentLink?.classList.contains('bg-blue-100')
          const companyActive = companySettingsLink?.classList.contains('bg-blue-100')

          // Exactly one should be active based on pathname
          if (pathname.startsWith('/ai-assessment')) {
            expect(aiActive).toBe(true)
            expect(companyActive).toBe(false)
          } else if (pathname.startsWith('/company-settings')) {
            expect(aiActive).toBe(false)
            expect(companyActive).toBe(true)
          } else {
            // Neither should be active for other paths
            expect(aiActive).toBe(false)
            expect(companyActive).toBe(false)
          }

          return true
        }
      ), { numRuns: 30 })
    })
  })
})