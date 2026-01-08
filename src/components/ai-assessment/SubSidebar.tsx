/**
 * Module Navigation Sidebar Component
 * 
 * Sub-navigation sidebar for switching between application modules.
 * Displays main modules: AI Assessment, Company Settings, etc.
 * 
 * Note: This is NOT the main app navigation.
 * This is a module-level navigation used for switching between major app sections.
 * 
 * Features:
 * - Module switching navigation
 * - Active module highlighting
 * - Responsive mobile menu
 * 
 * Used by: Assessment pages and other module pages
 */

'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  ChartBarIcon, 
  BuildingOfficeIcon, 
  Bars3Icon, 
  XMarkIcon 
} from '@heroicons/react/24/outline'
import { SubSidebarProps, SubSidebarItem } from '../../types/assessment'

const SubSidebar: React.FC<SubSidebarProps> = ({ 
  onModuleChange 
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const menuItems: SubSidebarItem[] = [
    {
      id: 'ai-assessment',
      label: 'AI Assessment',
      icon: ChartBarIcon,
      path: '/ai-assessment',
      isActive: pathname.startsWith('/ai-assessment')
    },
    {
      id: 'company-settings',
      label: 'Company Settings',
      icon: BuildingOfficeIcon,
      path: '/company-settings',
      isActive: pathname.startsWith('/company-settings')
    }
  ]

  const handleModuleChange = (moduleId: string) => {
    onModuleChange(moduleId)
    setIsMobileMenuOpen(false)
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={toggleMobileMenu}
          className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
          aria-expanded="false"
        >
          <span className="sr-only">Open main menu</span>
          {isMobileMenuOpen ? (
            <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
          ) : (
            <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-gray-600 bg-opacity-75"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Modules
            </h2>
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon as React.ComponentType<{ className?: string }>
              return (
                <Link
                  key={item.id}
                  href={item.path}
                  onClick={() => handleModuleChange(item.id)}
                  className={
                    item.isActive
                      ? 'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                      : 'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                >
                  <Icon
                    className={
                      item.isActive 
                        ? 'mr-3 h-5 w-5 flex-shrink-0 text-blue-500' 
                        : 'mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500'
                    }
                  />
                  {item.label}
                  {item.isActive && (
                    <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              AI Assessment Platform
            </div>
          </div>
        </div>
      </div>

      {/* Main content spacer for desktop */}
      <div className="hidden lg:block lg:w-64 lg:flex-shrink-0" />
    </>
  )
}

export default SubSidebar