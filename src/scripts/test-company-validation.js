// Simple test script to verify company validation functions
const { 
  validateCompanyName, 
  validateCompanyDescription, 
  validateCompanyForm,
  checkDuplicateCompanyName 
} = require('../utils/company-validation')

console.log('Testing Company Validation Functions...\n')

// Test validateCompanyName
console.log('1. Testing validateCompanyName:')
console.log('  Valid name "TechCorp":', validateCompanyName('TechCorp') === undefined ? 'PASS' : 'FAIL')
console.log('  Empty name "":', validateCompanyName('') === 'Company name is required' ? 'PASS' : 'FAIL')
console.log('  Short name "A":', validateCompanyName('A').includes('at least') ? 'PASS' : 'FAIL')
console.log('  Invalid chars "Tech@Corp":', validateCompanyName('Tech@Corp').includes('invalid') ? 'PASS' : 'FAIL')

// Test validateCompanyDescription
console.log('\n2. Testing validateCompanyDescription:')
console.log('  Undefined description:', validateCompanyDescription(undefined) === undefined ? 'PASS' : 'FAIL')
console.log('  Valid description:', validateCompanyDescription('Valid description') === undefined ? 'PASS' : 'FAIL')
console.log('  Long description:', validateCompanyDescription('A'.repeat(501)).includes('exceed') ? 'PASS' : 'FAIL')

// Test validateCompanyForm
console.log('\n3. Testing validateCompanyForm:')
const validForm = { name: 'Valid Company', description: 'Valid description' }
const validErrors = validateCompanyForm(validForm)
console.log('  Valid form has no errors:', Object.keys(validErrors).length === 0 ? 'PASS' : 'FAIL')

const invalidForm = { name: '', description: 'A'.repeat(501) }
const invalidErrors = validateCompanyForm(invalidForm)
console.log('  Invalid form has errors:', Object.keys(invalidErrors).length > 0 ? 'PASS' : 'FAIL')

// Test checkDuplicateCompanyName
console.log('\n4. Testing checkDuplicateCompanyName:')
const existingCompanies = [{ name: 'TechCorp' }, { name: 'Digital Solutions' }]
console.log('  Detects duplicate:', checkDuplicateCompanyName('TechCorp', existingCompanies) === true ? 'PASS' : 'FAIL')
console.log('  Allows unique name:', checkDuplicateCompanyName('New Company', existingCompanies) === false ? 'PASS' : 'FAIL')
console.log('  Case insensitive:', checkDuplicateCompanyName('techcorp', existingCompanies) === true ? 'PASS' : 'FAIL')

console.log('\nAll validation function tests completed!')