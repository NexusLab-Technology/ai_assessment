/**
 * Enhanced FixedQuestionContainer Component
 * Task 16.1: Complete responsive behavior with comprehensive screen size support
 * Requirements: 13.1, 13.2, 13.3, 13.4
 */

'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { ErrorBoundary } from './ErrorBoundary'
import { LoadingSpinner } from './LoadingSpinner'

interface EnhancedFixedQuestionContainerProps {
  children: React.ReactNode
  className?: string
  isLoading?: boolean
  error?: string | null
  onRetry?: () => void
  testId?: string
  // Responsive behavior props
  enableAutoResize?: boolean
  minHeight?: number
  maxHeight?: number
  // Layout stability props
  maintainScrollPosition?: boolean
  preventLayoutShift?: boolean
}

interface ContainerDimensions {
  width: number
  height: number
  padding: number
  scrollbarWidth: number
}

interface ScreenBreakpoints {
  xs: number  // 0-479px
  sm: number  // 480-767px
  md: number  // 768-1023px
  lg: number  // 1024-1279px
  xl: number  // 1280px+
}

export const EnhancedFixedQuestionContainer: React.FC<EnhancedFixedQuestionContainerProps> = ({
  children,
  className = '',
  isLoading = false,
  error = null,
  onRetry,
  testId = 'enhanced-fixed-question-container',
  enableAutoResize = true,
  minHeight = 400,
  maxHeight = 800,
  maintainScrollPosition = true,
  preventLayoutShift = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState<ContainerDimensions>({
    width: 0,
    height: 600,
    padding: 24,
    scrollbarWidth: 8
  })
  const [screenSize, setScreenSize] = useState<keyof ScreenBreakpoints>('md')
  const [scrollPosition, setScrollPosition] = useState(0)
  const [isContentOverflowing, setIsContentOverflowing] = useState(false)
  const [hasLayoutShifted, setHasLayoutShifted] = useState(false)

  // Screen breakpoints for responsive behavior
  const breakpoints: ScreenBreakpoints = {
    xs: 479,
    sm: 767,
    md: 1023,
    lg: 1279,
    xl: 9999
  }

  // Calculate optimal container dimensions based on screen size
  const calculateDimensions = useCallback((width: number): ContainerDimensions => {
    let height: number
    let padding: number
    let scrollbarWidth: number

    // Determine screen size category
    let currentScreenSize: keyof ScreenBreakpoints = 'xs'
    if (width > breakpoints.xs && width <= breakpoints.sm) currentScreenSize = 'sm'
    else if (width > breakpoints.sm && width <= breakpoints.md) currentScreenSize = 'md'
    else if (width > breakpoints.md && width <= breakpoints.lg) currentScreenSize = 'lg'
    else if (width > breakpoints.lg) currentScreenSize = 'xl'

    // Set dimensions based on screen size
    switch (currentScreenSize) {
      case 'xs':
        height = Math.max(minHeight, 400)
        padding = 16
        scrollbarWidth = 6
        break
      case 'sm':
        height = Math.max(minHeight, 500)
        padding = 20
        scrollbarWidth = 8
        break
      case 'md':
        height = Math.max(minHeight, 600)
        padding = 24
        scrollbarWidth = 8
        break
      case 'lg':
        height = Math.max(minHeight, 650)
        padding = 28
        scrollbarWidth = 10
        break
      case 'xl':
        height = Math.max(minHeight, 700)
        padding = 32
        scrollbarWidth = 12
        break
      default:
        height = 600
        padding = 24
        scrollbarWidth = 8
    }

    // Ensure height doesn't exceed maxHeight
    height = Math.min(height, maxHeight)

    setScreenSize(currentScreenSize)

    return {
      width,
      height,
      padding,
      scrollbarWidth
    }
  }, [minHeight, maxHeight, breakpoints])

  // Handle window resize with debouncing
  const handleResize = useCallback(() => {
    if (!enableAutoResize || !containerRef.current) return

    const containerWidth = containerRef.current.offsetWidth || window.innerWidth
    const newDimensions = calculateDimensions(containerWidth)
    
    // Prevent unnecessary re-renders
    if (
      newDimensions.width !== dimensions.width ||
      newDimensions.height !== dimensions.height ||
      newDimensions.padding !== dimensions.padding
    ) {
      setDimensions(newDimensions)
    }
  }, [enableAutoResize, calculateDimensions, dimensions])

  // Debounced resize handler
  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const debouncedResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(handleResize, 150)
    }

    if (enableAutoResize) {
      window.addEventListener('resize', debouncedResize)
      // Initial calculation
      setTimeout(handleResize, 100) // Delay initial calculation for test environment
    }

    return () => {
      window.removeEventListener('resize', debouncedResize)
      clearTimeout(timeoutId)
    }
  }, [enableAutoResize, handleResize])

  // Check for content overflow
  const checkContentOverflow = useCallback(() => {
    if (!contentRef.current) return

    const { scrollHeight, clientHeight } = contentRef.current
    const isOverflowing = scrollHeight > clientHeight
    
    if (isOverflowing !== isContentOverflowing) {
      setIsContentOverflowing(isOverflowing)
    }
  }, [isContentOverflowing])

  // Monitor content changes for overflow detection
  useEffect(() => {
    const observer = new MutationObserver(checkContentOverflow)
    
    if (contentRef.current) {
      observer.observe(contentRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true
      })
      
      // Initial check
      checkContentOverflow()
    }

    return () => observer.disconnect()
  }, [checkContentOverflow])

  // Maintain scroll position during layout changes
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (maintainScrollPosition) {
      setScrollPosition(e.currentTarget.scrollTop)
    }
  }, [maintainScrollPosition])

  // Restore scroll position after layout changes
  useEffect(() => {
    if (maintainScrollPosition && contentRef.current && scrollPosition > 0) {
      contentRef.current.scrollTop = scrollPosition
    }
  }, [maintainScrollPosition, scrollPosition, dimensions])

  // Detect layout shifts
  useEffect(() => {
    if (!preventLayoutShift || !containerRef.current) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        
        // Check if dimensions changed unexpectedly
        if (
          Math.abs(width - dimensions.width) > 5 ||
          Math.abs(height - dimensions.height) > 5
        ) {
          setHasLayoutShifted(true)
          
          // Reset after a short delay
          setTimeout(() => setHasLayoutShifted(false), 300)
        }
      }
    })

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [preventLayoutShift, dimensions])

  // Get responsive CSS classes
  const getResponsiveClasses = useCallback(() => {
    const baseClasses = [
      'enhanced-fixed-question-container',
      'relative',
      'w-full',
      'border',
      'border-gray-200',
      'rounded-lg',
      'bg-white',
      'shadow-sm',
      'overflow-hidden',
      'flex',
      'flex-col',
      'transition-all',
      'duration-300',
      'ease-in-out'
    ]

    // Add screen-size specific classes
    const responsiveClasses = {
      xs: ['text-sm'],
      sm: ['text-sm', 'shadow-md'],
      md: ['text-base', 'shadow-md'],
      lg: ['text-base', 'shadow-lg'],
      xl: ['text-lg', 'shadow-lg']
    }

    // Add layout shift prevention classes
    if (preventLayoutShift) {
      baseClasses.push('will-change-auto')
    }

    // Add overflow indicator classes
    if (isContentOverflowing) {
      baseClasses.push('overflow-indicator')
    }

    // Add layout shift warning classes
    if (hasLayoutShifted) {
      baseClasses.push('layout-shifted')
    }

    return [...baseClasses, ...responsiveClasses[screenSize]]
  }, [screenSize, preventLayoutShift, isContentOverflowing, hasLayoutShifted])

  // Get scrollbar styles based on screen size
  const getScrollbarStyles = useCallback(() => {
    const { scrollbarWidth } = dimensions
    
    return {
      scrollbarWidth: 'thin',
      scrollbarColor: '#d1d5db #f3f4f6',
      '--scrollbar-width': `${scrollbarWidth}px`,
      '--scrollbar-thumb-color': '#9ca3af',
      '--scrollbar-track-color': '#f3f4f6',
      '--scrollbar-thumb-hover-color': '#6b7280'
    } as React.CSSProperties
  }, [dimensions])

  // Error state
  if (error) {
    return (
      <div 
        ref={containerRef}
        className={`${getResponsiveClasses().join(' ')} ${className}`}
        style={{ height: dimensions.height }}
        data-testid={`${testId}-error`}
      >
        <div className="flex items-center justify-center h-full p-6">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Container Error</h3>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div 
        ref={containerRef}
        className={`${getResponsiveClasses().join(' ')} ${className}`}
        style={{ height: dimensions.height }}
        data-testid={`${testId}-loading`}
      >
        <div className="flex items-center justify-center h-full">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div 
        ref={containerRef}
        className={`${getResponsiveClasses().join(' ')} ${className}`}
        style={{ 
          height: dimensions.height,
          minHeight: minHeight,
          maxHeight: maxHeight
        }}
        data-testid={testId}
        data-screen-size={screenSize}
        data-content-overflowing={isContentOverflowing}
        data-layout-shifted={hasLayoutShifted}
      >
        {/* Container header with responsive indicators */}
        <div className="flex items-center justify-between p-2 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center space-x-2">
            {/* Screen size indicator */}
            <div className={`
              w-2 h-2 rounded-full
              ${screenSize === 'xs' ? 'bg-red-400' : ''}
              ${screenSize === 'sm' ? 'bg-orange-400' : ''}
              ${screenSize === 'md' ? 'bg-yellow-400' : ''}
              ${screenSize === 'lg' ? 'bg-green-400' : ''}
              ${screenSize === 'xl' ? 'bg-blue-400' : ''}
            `} />
            <span className="text-xs text-gray-500 font-mono">
              {screenSize.toUpperCase()} ({dimensions.width}×{dimensions.height})
            </span>
          </div>
          
          {/* Overflow indicator */}
          {isContentOverflowing && (
            <div className="flex items-center space-x-1 text-xs text-blue-600">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Scrollable</span>
            </div>
          )}

          {/* Layout shift warning */}
          {hasLayoutShifted && (
            <div className="flex items-center space-x-1 text-xs text-amber-600">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span>Layout Shift</span>
            </div>
          )}
        </div>

        {/* Main content area */}
        <div 
          ref={contentRef}
          className="flex-1 overflow-y-auto overflow-x-hidden"
          style={{
            padding: dimensions.padding,
            ...getScrollbarStyles()
          }}
          onScroll={handleScroll}
          data-testid={`${testId}-content`}
        >
          <div className="question-content-wrapper max-w-none">
            {children}
          </div>
        </div>

        {/* Responsive footer with container info */}
        <div className="px-3 py-1 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              Padding: {dimensions.padding}px | Scrollbar: {dimensions.scrollbarWidth}px
            </span>
            <span>
              {maintainScrollPosition ? 'Position Maintained' : 'Free Scroll'}
            </span>
          </div>
        </div>
      </div>

      {/* Custom CSS for enhanced scrollbar styling */}
      <style jsx>{`
        .enhanced-fixed-question-container {
          --scrollbar-width: ${dimensions.scrollbarWidth}px;
        }
        
        .enhanced-fixed-question-container ::-webkit-scrollbar {
          width: var(--scrollbar-width);
        }
        
        .enhanced-fixed-question-container ::-webkit-scrollbar-track {
          background: var(--scrollbar-track-color);
          border-radius: calc(var(--scrollbar-width) / 2);
        }
        
        .enhanced-fixed-question-container ::-webkit-scrollbar-thumb {
          background: var(--scrollbar-thumb-color);
          border-radius: calc(var(--scrollbar-width) / 2);
          transition: background-color 0.2s ease;
        }
        
        .enhanced-fixed-question-container ::-webkit-scrollbar-thumb:hover {
          background: var(--scrollbar-thumb-hover-color);
        }
        
        .enhanced-fixed-question-container.overflow-indicator {
          box-shadow: inset 0 -3px 6px -3px rgba(59, 130, 246, 0.1);
        }
        
        .enhanced-fixed-question-container.layout-shifted {
          animation: layoutShiftWarning 0.3s ease-in-out;
        }
        
        @keyframes layoutShiftWarning {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          75% { transform: translateX(2px); }
        }
        
        @media (max-width: 479px) {
          .enhanced-fixed-question-container {
            border-radius: 0.5rem;
            margin: 0.5rem;
          }
        }
        
        @media (min-width: 480px) and (max-width: 767px) {
          .enhanced-fixed-question-container {
            border-radius: 0.75rem;
          }
        }
        
        @media (min-width: 768px) {
          .enhanced-fixed-question-container {
            border-radius: 1rem;
          }
        }
      `}</style>
    </ErrorBoundary>
  )
}

export default EnhancedFixedQuestionContainer