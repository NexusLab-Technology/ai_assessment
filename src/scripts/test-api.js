/**
 * Simple script to test API endpoints
 * Run with: node src/scripts/test-api.js
 */

const BASE_URL = 'http://localhost:3000/api'

async function testAPI() {
  console.log('Testing AI Assessment API endpoints...\n')

  try {
    // Test companies endpoint
    console.log('1. Testing GET /api/companies')
    const companiesResponse = await fetch(`${BASE_URL}/companies`)
    const companiesData = await companiesResponse.json()
    console.log('Response:', companiesData)
    console.log('Status:', companiesResponse.status)
    console.log('')

    // Test creating a company
    console.log('2. Testing POST /api/companies')
    const createCompanyResponse = await fetch(`${BASE_URL}/companies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Company',
        description: 'A test company for API testing'
      })
    })
    const createCompanyData = await createCompanyResponse.json()
    console.log('Response:', createCompanyData)
    console.log('Status:', createCompanyResponse.status)
    console.log('')

    if (createCompanyData.success && createCompanyData.data) {
      const companyId = createCompanyData.data.id

      // Test creating an assessment
      console.log('3. Testing POST /api/assessments')
      const createAssessmentResponse = await fetch(`${BASE_URL}/assessments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Assessment',
          companyId: companyId,
          type: 'EXPLORATORY'
        })
      })
      const createAssessmentData = await createAssessmentResponse.json()
      console.log('Response:', createAssessmentData)
      console.log('Status:', createAssessmentResponse.status)
      console.log('')

      if (createAssessmentData.success && createAssessmentData.data) {
        const assessmentId = createAssessmentData.data.id

        // Test saving responses
        console.log('4. Testing POST /api/assessments/:id/responses')
        const saveResponsesResponse = await fetch(`${BASE_URL}/assessments/${assessmentId}/responses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stepId: 'step-1',
            responses: {
              'question-1': 'Test answer',
              'question-2': 42
            },
            currentStep: 1
          })
        })
        const saveResponsesData = await saveResponsesResponse.json()
        console.log('Response:', saveResponsesData)
        console.log('Status:', saveResponsesResponse.status)
        console.log('')

        // Test getting assessments
        console.log('5. Testing GET /api/assessments')
        const assessmentsResponse = await fetch(`${BASE_URL}/assessments?companyId=${companyId}`)
        const assessmentsData = await assessmentsResponse.json()
        console.log('Response:', assessmentsData)
        console.log('Status:', assessmentsResponse.status)
        console.log('')
      }
    }

    console.log('API testing completed!')

  } catch (error) {
    console.error('Error testing API:', error)
  }
}

// Check if we're running this script directly
if (require.main === module) {
  testAPI()
}

module.exports = { testAPI }