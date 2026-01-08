# MongoDB Database Example Data

This directory contains example JSON data representing actual MongoDB documents stored in the database. These files serve as data model references for understanding the database schema and structure.

## Soft Delete Pattern

**All collections use soft delete pattern:**
- When a record is "deleted", `isActive` is set to `false` instead of removing the record
- All queries automatically filter for `isActive: true` or records where `isActive` doesn't exist (backward compatibility)
- This prevents data loss and allows for recovery if needed
- Records with `isActive: false` are not displayed in normal queries

**Collections with soft delete:**
- ✅ `companies` - isActive field
- ✅ `assessments` - isActive field
- ✅ `reports` - isActive field
- ✅ `report_requests` - isActive field
- ✅ `rapid_questionnaires` - isActive field

## Files

- `companies.json` - Company documents (collection: `companies`)
- `assessments.json` - Assessment documents (collection: `assessments`)
- `rapid_questionnaires.json` - RAPID questionnaire documents (collection: `rapid_questionnaires`)
- `reports.json` - Report documents (collection: `reports`)
- `report_requests.json` - Report request documents (collection: `report_requests`)

## Data Model Overview

### Companies Collection

**Schema:**
```typescript
{
  _id: ObjectId
  name: string
  description?: string
  isActive: boolean  // Soft delete: true = active, false = deleted
  createdAt: Date
  updatedAt: Date
}
```

**Soft Delete:**
- When a company is deleted, `isActive` is set to `false` instead of removing the record
- All queries filter for `isActive: true` or records where `isActive` doesn't exist (backward compatibility)
- This prevents data loss and allows for recovery if needed

**Indexes:**
- `userId` (ascending)
- `name + userId` (compound, unique)
- `createdAt` (descending)
- Text index on `name` and `description`

### Assessments Collection

**Schema:**
```typescript
{
  _id: ObjectId
  name: string
  companyId: ObjectId
  type: 'EXPLORATORY' | 'MIGRATION'
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED'
  isActive: boolean  // Soft delete: true = active, false = deleted
  currentCategory: string
  currentSubcategory?: string
  totalCategories: number
  rapidQuestionnaireVersion: string
  responses: {
    [categoryId: string]: {
      [questionId: string]: any
    }
  }
  categoryStatuses: {
    [categoryId: string]: {
      categoryId: string
      status: 'not_started' | 'partial' | 'completed'
      completionPercentage: number
      lastModified: Date
      requiredQuestionsCount: number
      answeredRequiredCount: number
      totalQuestionsCount: number
      answeredTotalCount: number
    }
  }
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}
```

**Soft Delete:**
- When an assessment is deleted, `isActive` is set to `false` instead of removing the record
- All queries filter for `isActive: true` or records where `isActive` doesn't exist (backward compatibility)
- This prevents data loss and allows for recovery if needed

**Indexes:**
- `companyId` (ascending)
- `status` (ascending)
- `isActive` (ascending)
- `createdAt` (descending)
- `updatedAt` (descending)
- `rapidQuestionnaireVersion + type` (compound)
- `currentCategory + status` (compound)
- `type + status` (compound)
- `categoryStatuses.status` (nested field)

### RAPID Questionnaires Collection

**Schema:**
```typescript
{
  _id: ObjectId
  version: string
  assessmentType: 'EXPLORATORY' | 'MIGRATION'
  totalQuestions: number
  categories: Array<{
    id: string
    title: string
    description?: string
    subcategories: Array<{
      id: string
      title: string
      questions: Array<{
        id: string
        number: string
        text: string
        description?: string
        type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'number'
        required: boolean
        options?: string[]
        category: string
        subcategory: string
      }>
      questionCount: number
    }>
    totalQuestions: number
  }>
  createdAt: Date
  updatedAt: Date
  isActive: boolean
}
```

**Indexes:**
- `version + assessmentType` (compound, unique)
- `isActive + assessmentType` (compound)
- `createdAt` (descending)
- `categories.id` (nested field)
- `categories.subcategories.questions.id` (nested field)

### Reports Collection

**Schema:**
```typescript
{
  _id: ObjectId
  assessmentId: ObjectId
  companyId: ObjectId
  htmlContent: string
  generatedAt: Date
  isActive: boolean  // Soft delete: true = active, false = deleted
  metadata: {
    assessmentType: 'EXPLORATORY' | 'MIGRATION'
    assessmentName: string
    companyName: string
    totalQuestions: number
    answeredQuestions: number
    generationDuration?: number
    rapidQuestionnaireVersion?: string
    categoryBreakdown?: {
      [categoryId: string]: {
        categoryName: string
        totalQuestions: number
        answeredQuestions: number
        completionPercentage: number
      }
    }
  }
}
```

**Soft Delete:**
- When a report is deleted, `isActive` is set to `false` instead of removing the record
- All queries filter for `isActive: true` or records where `isActive` doesn't exist (backward compatibility)
- This prevents data loss and allows for recovery if needed

**Indexes:**
- `assessmentId` (unique)
- `companyId` (ascending)
- `isActive` (ascending)
- `generatedAt` (descending)
- `metadata.rapidQuestionnaireVersion` (nested field)

### Report Requests Collection

**Schema:**
```typescript
{
  _id: ObjectId
  assessmentId: ObjectId
  companyId: ObjectId
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  isActive: boolean  // Soft delete: true = active, false = deleted
  requestedAt: Date
  processedAt?: Date
  completedAt?: Date
  errorMessage?: string
  retryCount: number
  externalRequestId?: string
  rapidQuestionnaireVersion?: string
  assessmentType?: 'EXPLORATORY' | 'MIGRATION'
  categoryCount?: number
  completedCategories?: number
}
```

**Soft Delete:**
- When a report request is deleted, `isActive` is set to `false` instead of removing the record
- All queries filter for `isActive: true` or records where `isActive` doesn't exist (backward compatibility)
- This prevents data loss and allows for recovery if needed

**Indexes:**
- `assessmentId` (ascending)
- `status` (ascending)
- `isActive` (ascending)
- `requestedAt` (descending)
- `externalRequestId` (sparse)
- `rapidQuestionnaireVersion + assessmentType` (compound)

## Data Relationships

```
Company (1) ──→ (N) Assessment
Assessment (1) ──→ (1) Report
Assessment (1) ──→ (N) ReportRequest
Assessment (N) ──→ (1) RAPIDQuestionnaire (by version and type)
```

## Example ObjectIds

For consistency across examples:
- Company: `507f1f77bcf86cd799439011`
- Assessment (EXPLORATORY, IN_PROGRESS): `507f1f77bcf86cd799439020`
- Assessment (MIGRATION, COMPLETED): `507f1f77bcf86cd799439021`
- Assessment (EXPLORATORY, DRAFT): `507f1f77bcf86cd799439022`
- Questionnaire (EXPLORATORY): `507f1f77bcf86cd799439030`
- Questionnaire (MIGRATION): `507f1f77bcf86cd799439031`
- Report: `507f1f77bcf86cd799439040`
- ReportRequest (COMPLETED): `507f1f77bcf86cd799439050`
- ReportRequest (PENDING): `507f1f77bcf86cd799439051`
- ReportRequest (FAILED): `507f1f77bcf86cd799439052`
- ReportRequest (PROCESSING): `507f1f77bcf86cd799439053`

## Usage

These example files can be used for:

1. **Database Schema Reference**: Understand the structure of each collection
2. **Data Model Design**: Reference when creating or modifying data models
3. **Testing**: Import into MongoDB for testing purposes
4. **Development**: Use as reference when writing queries or aggregations
5. **Documentation**: Understand data relationships and field types

## Importing to MongoDB

To import these files into MongoDB:

```bash
# Import companies
mongoimport --db ai_assessment --collection companies --file example-data/companies.json --jsonArray

# Import assessments
mongoimport --db ai_assessment --collection assessments --file example-data/assessments.json --jsonArray

# Import questionnaires
mongoimport --db ai_assessment --collection rapid_questionnaires --file example-data/rapid_questionnaires.json --jsonArray

# Import reports
mongoimport --db ai_assessment --collection reports --file example-data/reports.json --jsonArray

# Import report requests
mongoimport --db ai_assessment --collection report_requests --file example-data/report_requests.json --jsonArray
```

## Soft Delete Pattern

**All collections use soft delete pattern:**
- When a record is "deleted", `isActive` is set to `false` instead of removing the record
- All queries automatically filter for `isActive: true` or records where `isActive` doesn't exist (backward compatibility)
- This prevents data loss and allows for recovery if needed
- Records with `isActive: false` are not displayed in normal queries

**Collections with soft delete:**
- ✅ `companies` - isActive field
- ✅ `assessments` - isActive field
- ✅ `reports` - isActive field
- ✅ `report_requests` - isActive field
- ✅ `rapid_questionnaires` - isActive field (already existed)

## Notes

- All ObjectIds use MongoDB Extended JSON format with `$oid`
- All dates use MongoDB Extended JSON format with `$date`
- Example data includes various states (DRAFT, IN_PROGRESS, COMPLETED)
- Example data includes both active (`isActive: true`) and deleted (`isActive: false`) records
- Responses show realistic data structures
- Category statuses demonstrate different completion states
- Report requests show different statuses (PENDING, PROCESSING, COMPLETED, FAILED)
