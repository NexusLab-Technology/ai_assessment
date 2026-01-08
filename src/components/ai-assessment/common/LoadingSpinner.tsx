/**
 * Loading Spinner Components for AI Assessment
 * Provides consistent loading states for category-based operations
 * Requirements: 9.1, 9.2, 9.3
 */

'use client'

import React from 'react'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex flex-col items-center space-y-2">
        <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-600`} />
        {text && (
          <p className="text-sm text-gray-600 animate-pulse">{text}</p>
        )}
      </div>
    </div>
  )
}

interface FullPageLoadingProps {
  title?: string
  message?: string
}

export const FullPageLoading: React.FC<FullPageLoadingProps> = ({
  title = 'Loading...',
  message = 'Please wait while we load your assessment data.'
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <h2 className="mt-4 text-xl font-semibold text-gray-900">{title}</h2>
        <p className="mt-2 text-gray-600 max-w-md">{message}</p>
      </div>
    </div>
  )
}

interface CategoryLoadingProps {
  categoryName?: string
  operation?: string
}

export const CategoryLoading: React.FC<CategoryLoadingProps> = ({
  categoryName,
  operation = 'Loading'
}) => {
  return (
    <div className="flex items-center justify-center p-8 bg-white rounded-lg border border-gray-200">
      <div className="text-center">
        <LoadingSpinner size="md" />
        <p className="mt-2 text-sm text-gray-600">
          {operation} {categoryName && `"${categoryName}"`}...
        </p>
      </div>
    </div>
  )
}

interface InlineLoadingProps {
  text?: string
  size?: 'sm' | 'md'
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({
  text = 'Loading...',
  size = 'sm'
}) => {
  return (
    <div className="flex items-center space-x-2">
      <Loader2 className={`${size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} animate-spin text-blue-600`} />
      <span className="text-sm text-gray-600">{text}</span>
    </div>
  )
}

interface LoadingStateProps {
  isLoading: boolean
  error?: string | null
  success?: boolean
  loadingText?: string
  errorText?: string
  successText?: string
  children: React.ReactNode
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  isLoading,
  error,
  success,
  loadingText = 'Loading...',
  errorText,
  successText,
  children
}) => {
  if (isLoading) {
    return <InlineLoading text={loadingText} />
  }

  if (error) {
    return (
      <div className="flex items-center space-x-2 text-red-600">
        <AlertCircle className="w-4 h-4" />
        <span className="text-sm">{errorText || error}</span>
      </div>
    )
  }

  if (success && successText) {
    return (
      <div className="flex items-center space-x-2 text-green-600">
        <CheckCircle className="w-4 h-4" />
        <span className="text-sm">{successText}</span>
      </div>
    )
  }

  return <>{children}</>
}

interface SkeletonProps {
  className?: string
  count?: number
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = 'h-4 bg-gray-200 rounded', 
  count = 1 
}) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`animate-pulse ${className} ${index > 0 ? 'mt-2' : ''}`}
        />
      ))}
    </>
  )
}

export const CategorySkeleton: React.FC = () => {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-6 bg-gray-200 rounded w-3/4" />
      <Skeleton className="h-4 bg-gray-200 rounded w-full" />
      <Skeleton className="h-4 bg-gray-200 rounded w-5/6" />
      <div className="space-y-2 mt-4">
        <Skeleton className="h-10 bg-gray-200 rounded" />
        <Skeleton className="h-10 bg-gray-200 rounded" />
        <Skeleton className="h-10 bg-gray-200 rounded" />
      </div>
    </div>
  )
}

export const QuestionSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-5 bg-gray-200 rounded w-2/3" />
      <Skeleton className="h-4 bg-gray-200 rounded w-full" />
      <Skeleton className="h-4 bg-gray-200 rounded w-4/5" />
      <Skeleton className="h-12 bg-gray-200 rounded mt-4" />
    </div>
  )
}