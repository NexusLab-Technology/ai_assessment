'use client'

import React, { useState, useRef, useEffect } from 'react'

interface TooltipProps {
  content: string
  children: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  disabled?: boolean
  className?: string
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  delay = 500,
  disabled = false,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [showTimeout, setShowTimeout] = useState<NodeJS.Timeout | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    return () => {
      if (showTimeout) {
        clearTimeout(showTimeout)
      }
    }
  }, [showTimeout])

  const handleMouseEnter = () => {
    if (disabled || !content) return
    
    const timeout = setTimeout(() => {
      setIsVisible(true)
    }, delay)
    
    setShowTimeout(timeout)
  }

  const handleMouseLeave = () => {
    if (showTimeout) {
      clearTimeout(showTimeout)
      setShowTimeout(null)
    }
    setIsVisible(false)
  }

  const handleFocus = () => {
    if (disabled || !content) return
    setIsVisible(true)
  }

  const handleBlur = () => {
    setIsVisible(false)
  }

  const getTooltipClasses = () => {
    const baseClasses = `
      absolute z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded-md shadow-lg
      pointer-events-none transition-opacity duration-200 whitespace-nowrap
      ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}
    `

    const positionClasses = {
      top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
      bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
      left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
      right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
    }

    return `${baseClasses} ${positionClasses[position]}`
  }

  const getArrowClasses = () => {
    const baseClasses = 'absolute w-2 h-2 bg-gray-900 transform rotate-45'
    
    const arrowPositions = {
      top: 'top-full left-1/2 transform -translate-x-1/2 -translate-y-1/2',
      bottom: 'bottom-full left-1/2 transform -translate-x-1/2 translate-y-1/2',
      left: 'left-full top-1/2 transform -translate-y-1/2 -translate-x-1/2',
      right: 'right-full top-1/2 transform -translate-y-1/2 translate-x-1/2'
    }

    return `${baseClasses} ${arrowPositions[position]}`
  }

  return (
    <div 
      ref={triggerRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {children}
      
      {content && (
        <div
          ref={tooltipRef}
          className={getTooltipClasses()}
          role="tooltip"
          aria-hidden={!isVisible}
        >
          {content}
          <div className={getArrowClasses()} />
        </div>
      )}
    </div>
  )
}

export default Tooltip