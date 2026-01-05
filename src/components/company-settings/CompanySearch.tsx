'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { CompanySearchProps } from '@/types/company'

const CompanySearch: React.FC<CompanySearchProps> = ({
  onSearch,
  placeholder = 'Search companies...',
  debounceMs = 300
}) => {
  const [searchValue, setSearchValue] = useState('')
  const [debouncedValue, setDebouncedValue] = useState('')

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(searchValue)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [searchValue, debounceMs])

  // Call onSearch when debounced value changes
  useEffect(() => {
    onSearch(debouncedValue)
  }, [debouncedValue, onSearch])

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(event.target.value)
  }, [])

  const handleClearSearch = useCallback(() => {
    setSearchValue('')
    setDebouncedValue('')
  }, [])

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      handleClearSearch()
      event.currentTarget.blur() // Remove focus after clearing
    }
    // Allow Tab navigation
    if (event.key === 'Tab') {
      // Let default tab behavior work
      return
    }
  }, [handleClearSearch])

  return (
    <div className="relative max-w-md w-full">
      <div className="relative">
        {/* Search Icon */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>

        {/* Search Input */}
        <input
          type="text"
          value={searchValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200 hover:border-gray-400"
          aria-label="Search companies"
          aria-describedby="search-description"
          role="searchbox"
        />
        
        {/* Hidden description for screen readers */}
        <div id="search-description" className="sr-only">
          Search through your companies by name or description. Press Escape to clear the search.
        </div>

        {/* Clear Button */}
        {searchValue && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <button
              onClick={handleClearSearch}
              className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded-sm transition-all duration-200 p-1"
              aria-label="Clear search"
              tabIndex={0}
            >
              <XMarkIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {/* Search Status */}
      {debouncedValue && debouncedValue !== searchValue && (
        <div className="absolute top-full left-0 right-0 mt-1 px-3 py-1 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-600">
          Searching for "{debouncedValue}"...
        </div>
      )}
    </div>
  )
}

export default CompanySearch