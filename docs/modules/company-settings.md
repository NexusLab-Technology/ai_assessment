# Company Settings Module Documentation

## Overview

The Company Settings Module provides comprehensive company management functionality for the RAPID AI Assessment Platform. It enables users to create, edit, delete, and search companies, with seamless integration to the AI Assessment module.

## Key Features

### 1. Company Management
- **Create Companies**: Add new companies with name and description
- **Edit Companies**: Update company information
- **Delete Companies**: Remove companies with cascade deletion of assessments
- **Search Companies**: Search companies by name with real-time filtering

### 2. Assessment Integration
- **Assessment Count**: Display number of assessments per company
- **Quick Navigation**: Navigate to AI Assessment module with company pre-selected
- **Data Consistency**: Maintain referential integrity between companies and assessments

### 3. User Experience
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Real-time Validation**: Immediate feedback on form inputs
- **Error Handling**: Comprehensive error messages and recovery suggestions
- **Loading States**: Clear indicators during operations

## Architecture

### Component Structure

```
Company Settings Module
├── CompanyContainer
│   ├── CompanyDashboard
│   │   ├── CompanySearch
│   │   └── CompanyList
│   │       └── CompanyCard
│   └── CompanyForm
└── CompanyErrorBoundary
```

### Data Flow

1. **Load Companies**: Fetch all companies for the authenticated user
2. **Display List**: Show companies with assessment counts
3. **Search/Filter**: Filter companies by name
4. **Create/Edit**: Open form for company creation or editing
5. **Save**: Validate and save company data
6. **Delete**: Confirm and delete company with cascade deletion
7. **Navigate**: Link to AI Assessment module with company context

## Components

### CompanyContainer

Main container component that manages company state and operations. Wrapped in `CompanyErrorBoundary` for error handling.

**Props:**
```typescript
// No props - self-contained component
```

**Responsibilities:**
- Manage company list state
- Handle CRUD operations with retry mechanism
- Coordinate with API services via `companyAPIClient`
- Manage loading and error states
- Handle form state (create/edit modes)
- Integrate with enhanced error handling system
- Use `companyRetryManager` for automatic retries

---

### CompanyDashboard

Main dashboard displaying company list with search and management features. Includes integrated form modal.

**Props:**
```typescript
interface CompanyDashboardProps {
  companies?: Company[]
  loading: boolean
  error?: string
  onCreateCompany: () => void
  onEditCompany: (company: Company) => void
  onDeleteCompany: (companyId: string) => void
  onSearchCompanies: (query: string) => void
  // Extended props for form handling
  currentFormData?: CompanyFormData | null
  editingCompany?: Company
  onFormSubmit?: (formData: CompanyFormData) => void
  onFormCancel?: () => void
  formLoading?: boolean
  // Enhanced error handling props
  companyError?: CompanyError
  onRetry?: () => void
  onDismissError?: () => void
  retryCount?: number
}
```

**Features:**
- Company list/grid display (responsive: 1 column mobile, 2 tablet, 3 desktop)
- Client-side search filtering (by name and description)
- Integrated form modal for create/edit
- Create, edit, delete actions
- Assessment count display
- Empty state handling
- Error display with retry functionality
- Focus management for accessibility
- Keyboard navigation (Escape to close modal, Ctrl/Cmd+Enter to submit)
- Results summary display

---

### CompanyForm

Form component for creating and editing companies with comprehensive validation.

**Props:**
```typescript
interface CompanyFormProps {
  company?: Company // undefined for create, defined for edit
  onSubmit: (companyData: CompanyFormData) => void
  onCancel: () => void
  loading: boolean
  errors?: FormErrors
  existingCompanies?: Company[] // For duplicate name checking
}
```

**Features:**
- Real-time validation with duplicate name checking
- Field-level validation states (valid/invalid/neutral)
- Visual validation indicators (checkmarks, error icons)
- Character count display with warnings
- Error message display (field-level and general)
- Loading states
- Support for both create and edit modes
- Keyboard shortcuts (Escape to cancel, Ctrl/Cmd+Enter to submit)
- Accessibility features (ARIA labels, focus management)
- Validation summary display

---

### CompanyCard

Individual company card component with integrated navigation and delete confirmation.

**Props:**
```typescript
interface CompanyCardProps {
  company: Company
  onEdit: (company: Company) => void
  onDelete: (companyId: string) => void
}
```

**Features:**
- Company information display (name, description, creation date)
- Assessment count display
- Edit and delete actions with tooltips
- Delete confirmation modal with cascade warning
- Navigation to AI Assessment module (with company pre-selected)
- "New Assessment" button for quick access
- Keyboard navigation (Enter/Space to edit, Delete key to delete)
- Responsive layout with hover effects
- Focus management for accessibility

---

### CompanySearch

Search input component with debouncing and client-side filtering.

**Props:**
```typescript
interface CompanySearchProps {
  onSearch: (query: string) => void
  placeholder?: string
  debounceMs?: number // Default: 300ms
}
```

**Features:**
- Debounced search input (300ms default)
- Clear search functionality (X button)
- Keyboard support (Escape to clear)
- Real-time filtering (client-side, filters by name and description)
- Search status indicator
- Accessibility features (ARIA labels, screen reader support)
- Responsive design

---

### CompanyErrorBoundary

Error boundary component for graceful error handling.

**Features:**
- Catch component errors
- Display user-friendly error messages
- Provide recovery options
- Log errors for debugging

### Tooltip

Reusable tooltip component used throughout the Company Settings module.

**Props:**
```typescript
interface TooltipProps {
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  children: React.ReactNode
}
```

**Features:**
- Contextual help text
- Position customization
- Accessibility support

## Data Models

### Company

```typescript
interface Company {
  id: string
  name: string
  description?: string
  createdAt: Date
  updatedAt: Date
  assessmentCount: number
}
```

### Company Document (MongoDB)

```typescript
interface CompanyDocument {
  _id: ObjectId
  name: string
  description?: string
  createdAt: Date
  updatedAt: Date
  userId: string // Owner of the company
}
```

## API Integration

### Key Endpoints

**Companies:**
- `GET /api/companies` - List all companies for authenticated user
- `POST /api/companies` - Create new company
- `GET /api/companies/[id]` - Get company by ID (includes assessment count)
- `PUT /api/companies/[id]` - Update company (name and/or description)
- `DELETE /api/companies/[id]` - Delete company with cascade deletion of assessments
- `GET /api/companies/search?q={query}` - Search companies by name/description

**Response Formats:**
- Success responses: `{ success: true, data: {...} }`
- Error responses: `{ success: false, error: string, message?: string }`
- Delete response includes: `{ deletedCompany: boolean, deletedAssessments: number, totalAssessments: number }`

**Note:** All endpoints require authentication and filter by `userId`. The search endpoint exists but client-side filtering is primarily used in the dashboard.

See [API Documentation](../api/README.md) for detailed endpoint documentation.

## Validation Rules

### Company Name

- **Required**: Yes
- **Min Length**: 2 characters
- **Max Length**: 100 characters
- **Pattern**: Alphanumeric, spaces, hyphens, underscores, ampersands, periods, parentheses
- **Uniqueness**: Unique per user

### Company Description

- **Required**: No
- **Max Length**: 500 characters
- **Allow Empty**: Yes

## State Management

### Company State

The module uses React state management with the following key states:

1. **Company List**: All companies for the user (from API)
2. **Filtered List**: Companies matching search query (client-side filtered)
3. **Form State**: Company form data and validation
   - `currentFormData`: Current form data (null when no form open)
   - `editingCompany`: Company being edited (undefined for create mode)
   - `formLoading`: Loading state for form submission
4. **Loading States**: Operation-specific loading indicators
   - `loading`: Main loading state (fetching companies)
   - `formLoading`: Form submission loading
5. **Error States**: Error messages and recovery options
   - `error`: General error message
   - `companyError`: Enhanced error object with retry information
   - `retryCount`: Number of retry attempts
6. **Search State**: Search query and filtered results
   - `searchQuery`: Current search query
   - `filteredCompanies`: Companies matching search (computed from companies + searchQuery)

## Error Handling

The module uses an enhanced error handling system (`company-error-handling.ts`) with retry mechanisms.

### Validation Errors

- **Real-time Validation**: Immediate feedback as users type
- **Field-level Errors**: Specific error messages per field
- **Form-level Errors**: General form validation errors
- **Server Validation**: Comprehensive server-side validation
- **Duplicate Name Checking**: Client-side duplicate detection before submission
- **Visual Validation States**: Valid/invalid/neutral states with icons

### Network Errors

- **Retry Mechanism**: Automatic retry via `companyRetryManager` for retryable errors
- **Error Classification**: Errors classified as retryable or non-retryable
- **Error Messages**: User-friendly error descriptions via `CompanyError` type
- **Recovery Suggestions**: Helpful guidance for resolving errors
- **Retry Count Display**: Shows retry attempts to user
- **Manual Retry**: User can manually retry failed operations

### Data Consistency Errors

- **Optimistic Updates**: Immediate UI feedback with rollback on failure
- **Conflict Resolution**: Handle concurrent modifications gracefully
- **Cascade Deletion**: Proper handling of assessment deletion (deletes all associated assessments)
- **Error Logging**: Comprehensive error logging via `logCompanyError`

### Error Types

```typescript
interface CompanyError {
  message: string
  code?: string
  retryable: boolean
  originalError?: Error
}
```

## User Experience Features

### Responsive Design

- **Desktop (1024px+)**: Full layout with grid display
- **Tablet (768px-1023px)**: Adapted layout with stacked elements
- **Mobile (<768px)**: Vertical stacking with collapsible sidebar

### Accessibility

- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: Proper ARIA labels
- **Focus Management**: Visible focus indicators
- **Color Contrast**: Sufficient contrast ratios

### Visual Feedback

- **Loading Indicators**: Spinners during operations
- **Success Messages**: Confirmation messages after operations
- **Error Messages**: Clear error descriptions
- **Hover Effects**: Visual feedback on interactive elements

## Integration with AI Assessment Module

### Navigation Flow

1. **From Company Settings**: 
   - Click "View assessments" → Navigate to `/ai-assessment?companyId={id}` with company pre-selected
   - Click "New Assessment" → Navigate to `/ai-assessment?companyId={id}` to start new assessment
   - Click "AI Assessment" button → Navigate to `/ai-assessment` (general view)
2. **From AI Assessment**: No companies → Redirect to Company Settings with message
3. **Company Creation**: After creating company → Quick link to start assessment

### Data Consistency

- **Assessment Count**: Real-time count from assessments collection (via `CompanyModel.getAssessmentCount`)
- **Cascade Deletion**: Deleting company deletes all associated assessments (via MongoDB `deleteMany`)
- **Referential Integrity**: Company ID validation in assessments
- **User Isolation**: All operations filtered by `userId` for data security

### API Client

The module uses `company-api-client.ts` which provides:
- Type-safe API methods
- Consistent error handling
- Automatic response parsing
- Base URL configuration

## Testing

### Unit Tests

- Component rendering
- Form validation
- Search functionality
- CRUD operations

### Property-Based Tests

- Company name uniqueness per user
- Company CRUD operations consistency
- Company update preservation
- Assessment count accuracy
- Search functionality correctness
- Company deletion cascade
- Form validation consistency
- Navigation integration correctness
- Responsive layout preservation
- Data persistence round-trip

### Integration Tests

- End-to-end company management flow
- Integration with AI Assessment module
- Cascade deletion workflow
- Search and filter functionality

## Performance Considerations

### Optimization Strategies

1. **Debouncing**: Debounce search input
2. **Caching**: Cache company list data
3. **Lazy Loading**: Load assessment counts on demand
4. **Pagination**: Paginate large company lists (future enhancement)

### Best Practices

- Minimize re-renders with React.memo
- Use useCallback for event handlers
- Optimize state updates
- Implement proper loading states

## Security Considerations

### Data Isolation

- **User-based Queries**: All queries filtered by userId
- **Authorization**: Verify user ownership before operations
- **Input Sanitization**: Sanitize all user inputs

### Validation

- **Client-side**: Immediate feedback
- **Server-side**: Comprehensive validation before database operations
- **Type Checking**: TypeScript type safety

## Future Enhancements

1. **Bulk Operations**: Bulk import/export companies
2. **Company Templates**: Pre-configured company templates
3. **Advanced Search**: Search by description, date range, etc.
4. **Company Analytics**: Statistics and insights
5. **Permissions**: Role-based access control
6. **Company Groups**: Organize companies into groups

## Related Documentation

- [API Documentation](../api/README.md)
- [AI Assessment Module](./ai-assessment.md)
- [Architecture Documentation](../architecture/README.md)

