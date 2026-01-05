'use client'

import React, { useState } from 'react'
import { validateCompanyName, validateCompanyDescription } from '@/utils/company-validation'
import { mockCompanyAPI } from '@/lib/mock-company-api'

const TestCompanyPage: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const runTests = async () => {
    setLoading(true)
    const results: string[] = []

    try {
      // Test validation functions
      results.push('=== Testing Validation Functions ===')
      
      // Test validateCompanyName
      const validName = validateCompanyName('TechCorp')
      results.push(`Valid name "TechCorp": ${validName === undefined ? 'PASS' : 'FAIL'}`)
      
      const emptyName = validateCompanyName('')
      results.push(`Empty name: ${emptyName === 'Company name is required' ? 'PASS' : 'FAIL'}`)
      
      const shortName = validateCompanyName('A')
      results.push(`Short name: ${shortName?.includes('at least') ? 'PASS' : 'FAIL'}`)
      
      // Test validateCompanyDescription
      const validDesc = validateCompanyDescription('Valid description')
      results.push(`Valid description: ${validDesc === undefined ? 'PASS' : 'FAIL'}`)
      
      const longDesc = validateCompanyDescription('A'.repeat(501))
      results.push(`Long description: ${longDesc?.includes('exceed') ? 'PASS' : 'FAIL'}`)

      // Test mock API
      results.push('\n=== Testing Mock API ===')
      
      // Test getting companies
      const companiesResponse = await mockCompanyAPI.getCompanies()
      results.push(`Get companies: ${companiesResponse.companies.length > 0 ? 'PASS' : 'FAIL'}`)
      results.push(`Companies count: ${companiesResponse.companies.length}`)
      
      // Test creating a company
      try {
        const createResponse = await mockCompanyAPI.createCompany({
          name: 'Test Company ' + Date.now(),
          description: 'Test description'
        })
        results.push(`Create company: ${createResponse.company ? 'PASS' : 'FAIL'}`)
      } catch (error) {
        results.push(`Create company: FAIL - ${error}`)
      }
      
      // Test search
      const searchResponse = await mockCompanyAPI.searchCompanies('Tech')
      results.push(`Search companies: ${searchResponse.companies.length >= 0 ? 'PASS' : 'FAIL'}`)
      
      results.push('\n=== All Tests Completed ===')
      
    } catch (error) {
      results.push(`ERROR: ${error}`)
    }
    
    setTestResults(results)
    setLoading(false)
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Company Settings Test Page</h1>
      
      <div className="mb-6">
        <button
          onClick={runTests}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Running Tests...' : 'Run Tests'}
        </button>
      </div>
      
      {testResults.length > 0 && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-4">Test Results:</h2>
          <pre className="whitespace-pre-wrap text-sm">
            {testResults.join('\n')}
          </pre>
        </div>
      )}
      
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Navigation Links:</h2>
        <div className="space-y-2">
          <div>
            <a href="/company-settings" className="text-blue-600 hover:underline">
              Go to Company Settings
            </a>
          </div>
          <div>
            <a href="/ai-assessment" className="text-blue-600 hover:underline">
              Go to AI Assessment
            </a>
          </div>
          <div>
            <a href="/" className="text-blue-600 hover:underline">
              Go to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TestCompanyPage