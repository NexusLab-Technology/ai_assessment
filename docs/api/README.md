# API Reference Documentation

Complete API documentation for the RAPID AI Assessment Platform.

## Base URL

All API endpoints are prefixed with `/api`.

## Authentication

Most endpoints require authentication. The system uses a configurable authentication framework that can be enabled or disabled via environment variables.

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message"
}
```

## HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (e.g., duplicate resource)
- `429` - Too Many Requests (rate limiting)
- `500` - Internal Server Error

---

## Assessment APIs

### List Assessments

**GET** `/api/assessments`

Retrieve all assessments for the authenticated user, optionally filtered by company.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `companyId` | string | No | Filter assessments by company ID |

#### Response

```json
{
  "success": true,
  "data": {
    "assessments": [
      {
        "id": "string",
        "name": "string",
        "companyId": "string",
        "type": "EXPLORATORY" | "MIGRATION",
        "status": "DRAFT" | "IN_PROGRESS" | "COMPLETED",
        "currentStep": "number",
        "totalSteps": "number",
        "currentCategory": "string",
        "currentSubcategory": "string",
        "completionPercentage": "number",
        "createdAt": "ISO 8601 date",
        "updatedAt": "ISO 8601 date",
        "completedAt": "ISO 8601 date (optional)"
      }
    ],
    "total": "number"
  }
}
```

---

### Create Assessment

**POST** `/api/assessments`

Create a new assessment for a company.

#### Request Body

```json
{
  "name": "string (required)",
  "companyId": "string (required)",
  "type": "EXPLORATORY" | "MIGRATION (required)"
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "assessment": {
      "id": "string",
      "name": "string",
      "companyId": "string",
      "type": "EXPLORATORY" | "MIGRATION",
      "status": "DRAFT",
      "currentStep": 1,
      "totalSteps": 5,
      "responses": {},
      "createdAt": "ISO 8601 date",
      "updatedAt": "ISO 8601 date"
    },
    "message": "Assessment created successfully"
  }
}
```

#### Error Responses

- `400` - Missing required fields or invalid assessment type
- `404` - Company not found

---

### Get Assessment

**GET** `/api/assessments/[id]`

Retrieve a specific assessment by ID.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Assessment ID |

#### Response

```json
{
  "success": true,
  "data": {
    "assessment": {
      "id": "string",
      "name": "string",
      "companyId": "string",
      "type": "EXPLORATORY" | "MIGRATION",
      "status": "DRAFT" | "IN_PROGRESS" | "COMPLETED",
      "currentCategory": "string",
      "currentSubcategory": "string",
      "responses": {
        "categoryId": {
          "questionId": "any"
        }
      },
      "categoryStatuses": {
        "categoryId": {
          "status": "not_started" | "partial" | "completed",
          "completionPercentage": "number",
          "lastModified": "ISO 8601 date"
        }
      },
      "rapidQuestionnaireVersion": "string",
      "createdAt": "ISO 8601 date",
      "updatedAt": "ISO 8601 date",
      "completedAt": "ISO 8601 date (optional)"
    },
    "statistics": {
      "totalCategories": "number",
      "completedCategories": "number",
      "inProgressCategories": "number",
      "notStartedCategories": "number",
      "overallCompletionPercentage": "number"
    }
  }
}
```

#### Error Responses

- `400` - Assessment ID is required
- `404` - Assessment not found

---

### Update Assessment

**PUT** `/api/assessments/[id]`

Update assessment metadata (e.g., current category).

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Assessment ID |

#### Request Body

```json
{
  "currentCategory": "string (optional)",
  "currentSubcategory": "string (optional)"
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "assessment": {
      // Updated assessment object
    },
    "message": "Assessment updated successfully"
  }
}
```

---

### Delete Assessment

**DELETE** `/api/assessments/[id]`

Delete an assessment.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Assessment ID |

#### Response

```json
{
  "success": true,
  "data": {
    "message": "Assessment deleted successfully"
  }
}
```

---

### Get Assessment Responses

**GET** `/api/assessments/[id]/responses`

Retrieve all responses for an assessment.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Assessment ID |

#### Response

```json
{
  "success": true,
  "data": {
    "responses": {
      "categoryId": {
        "questionId": "any"
      }
    },
    "categoryStatuses": {
      "categoryId": {
        "status": "not_started" | "partial" | "completed",
        "completionPercentage": "number",
        "lastModified": "ISO 8601 date"
      }
    },
    "currentCategory": "string",
    "currentSubcategory": "string",
    "status": "DRAFT" | "IN_PROGRESS" | "COMPLETED"
  }
}
```

---

### Save Assessment Responses

**PUT** `/api/assessments/[id]/responses`

Save or update responses for a specific category.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Assessment ID |

#### Request Body

```json
{
  "categoryId": "string (required)",
  "responses": {
    "questionId": "any"
  },
  "categoryStatus": {
    "status": "not_started" | "partial" | "completed",
    "completionPercentage": "number"
  },
  "currentCategory": "string (optional)",
  "currentSubcategory": "string (optional)"
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "responses": {
      "categoryId": {
        "questionId": "any"
      }
    },
    "categoryStatuses": {
      "categoryId": {
        "status": "not_started" | "partial" | "completed",
        "completionPercentage": "number",
        "lastModified": "ISO 8601 date"
      }
    },
    "currentCategory": "string",
    "currentSubcategory": "string",
    "message": "Assessment updated successfully"
  }
}
```

---

### Complete Assessment

**PATCH** `/api/assessments/[id]/responses`

Mark an assessment as completed.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Assessment ID |

#### Request Body

```json
{
  "action": "complete"
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "message": "Assessment completed successfully"
  }
}
```

---

### Get Assessment Review

**GET** `/api/assessments/[id]/review`

Get comprehensive review data for an assessment, including completion status and validation.

---

### Validate Assessment

**GET** `/api/assessments/[id]/validate`

Get validation summary for an assessment.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Assessment ID |

#### Response

```json
{
  "assessmentId": "string",
  "validation": {
    "isValid": "boolean",
    "errors": ["string"],
    "warnings": ["string"],
    "completionStatus": {
      "overallCompletion": "number",
      "categoryCompletions": {
        "categoryId": "number"
      }
    }
  },
  "timestamp": "ISO 8601 date"
}
```

---

### Validate Assessment (POST)

**POST** `/api/assessments/[id]/validate`

Validate specific responses or categories.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Assessment ID |

#### Request Body

```json
{
  "validationType": "category" | "responses" | "completion" | "questionnaire",
  "categoryId": "string (required for category validation)",
  "responses": {
    "categoryId": {
      "questionId": "any"
    }
  },
  "realTime": "boolean (optional)"
}
```

#### Response

```json
{
  "assessmentId": "string",
  "validationType": "string",
  "categoryId": "string | null",
  "validation": {
    "isValid": "boolean",
    "errors": ["string"],
    "warnings": ["string"]
  },
  "timestamp": "ISO 8601 date"
}
```

---

### Save Validated Responses

**PUT** `/api/assessments/[id]/validate`

Save responses with validation.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Assessment ID |

#### Request Body

```json
{
  "responses": {
    "categoryId": {
      "questionId": "any"
    }
  },
  "validateBeforeSave": "boolean (default: true)"
}
```

#### Response

```json
{
  "assessmentId": "string",
  "saved": "boolean",
  "validation": {
    "isValid": "boolean",
    "errors": ["string"]
  },
  "message": "string",
  "timestamp": "ISO 8601 date"
}
```

---

### Clear Validation Cache

**DELETE** `/api/assessments/[id]/validate`

Clear validation cache for an assessment.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Assessment ID |

#### Response

```json
{
  "assessmentId": "string",
  "message": "Validation cache cleared successfully",
  "timestamp": "ISO 8601 date"
}
```

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Assessment ID |

#### Response

```json
{
  "success": true,
  "data": {
    "assessment": {
      "id": "string",
      "name": "string",
      "type": "EXPLORATORY" | "MIGRATION",
      "status": "DRAFT" | "IN_PROGRESS" | "COMPLETED",
      "currentCategory": "string",
      "rapidQuestionnaireVersion": "string",
      "createdAt": "ISO 8601 date",
      "updatedAt": "ISO 8601 date",
      "completedAt": "ISO 8601 date (optional)"
    },
    "questionnaire": {
      "version": "string",
      "assessmentType": "EXPLORATORY" | "MIGRATION",
      "totalQuestions": "number",
      "totalCategories": "number"
    },
    "statistics": {
      "totalCategories": "number",
      "completedCategories": "number",
      "inProgressCategories": "number",
      "notStartedCategories": "number",
      "overallCompletionPercentage": "number"
    },
    "categoryDetails": [
      {
        "categoryId": "string",
        "categoryTitle": "string",
        "categoryDescription": "string",
        "totalQuestions": "number",
        "requiredQuestions": "number",
        "answeredQuestions": "number",
        "answeredRequiredQuestions": "number",
        "completionPercentage": "number",
        "status": "not_started" | "partial" | "completed",
        "lastModified": "ISO 8601 date",
        "isComplete": "boolean",
        "subcategories": [
          {
            "subcategoryId": "string",
            "subcategoryTitle": "string",
            "subcategoryDescription": "string",
            "totalQuestions": "number",
            "requiredQuestions": "number",
            "answeredQuestions": "number",
            "answeredRequiredQuestions": "number",
            "completionPercentage": "number",
            "isComplete": "boolean",
            "questions": [
              {
                "questionId": "string",
                "questionNumber": "string",
                "questionText": "string",
                "questionType": "text" | "textarea" | "select" | "radio" | "checkbox",
                "required": "boolean",
                "options": ["string"],
                "response": "any",
                "hasResponse": "boolean",
                "isValid": "boolean"
              }
            ]
          }
        ],
        "validation": {
          "allRequiredAnswered": "boolean",
          "missingRequiredQuestions": [
            {
              "questionId": "string",
              "questionNumber": "string",
              "questionText": "string"
            }
          ],
          "invalidResponses": [
            {
              "questionId": "string",
              "questionNumber": "string",
              "questionText": "string",
              "issue": "string"
            }
          ]
        }
      }
    ],
    "summary": {
      "totalQuestions": "number",
      "totalAnswered": "number",
      "totalRequired": "number",
      "totalRequiredAnswered": "number",
      "overallCompletionPercentage": "number",
      "requiredCompletionPercentage": "number"
    },
    "validation": {
      "allRequiredAnswered": "boolean",
      "readyForCompletion": "boolean",
      "nextRecommendedCategory": {
        "categoryId": "string",
        "categoryTitle": "string",
        "completionPercentage": "number"
      } | null,
      "completionIssues": [
        {
          "categoryId": "string",
          "categoryTitle": "string",
          "questionId": "string",
          "questionNumber": "string",
          "questionText": "string",
          "issue": "string"
        }
      ]
    }
  }
}
```

---

## Company APIs

### List Companies

**GET** `/api/companies`

Retrieve all companies for the authenticated user.

#### Response

```json
{
  "success": true,
  "data": {
    "companies": [
      {
        "id": "string",
        "name": "string",
        "description": "string (optional)",
        "createdAt": "ISO 8601 date",
        "updatedAt": "ISO 8601 date",
        "assessmentCount": "number"
      }
    ],
    "total": "number"
  }
}
```

---

### Create Company

**POST** `/api/companies`

Create a new company.

#### Request Body

```json
{
  "name": "string (required, 2-100 characters)",
  "description": "string (optional, max 500 characters)"
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "company": {
      "id": "string",
      "name": "string",
      "description": "string",
      "createdAt": "ISO 8601 date",
      "updatedAt": "ISO 8601 date",
      "assessmentCount": 0
    },
    "message": "Company created successfully"
  }
}
```

#### Error Responses

- `400` - Invalid company name (too short, too long, or duplicate)
- `500` - Database error

---

### Get Company

**GET** `/api/companies/[id]`

Retrieve a specific company by ID.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Company ID (MongoDB ObjectId) |

#### Response

```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "description": "string",
    "createdAt": "ISO 8601 date",
    "updatedAt": "ISO 8601 date",
    "assessmentCount": "number"
  }
}
```

#### Error Responses

- `400` - Invalid company ID format
- `404` - Company not found

---

### Update Company

**PUT** `/api/companies/[id]`

Update company information.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Company ID (MongoDB ObjectId) |

#### Request Body

```json
{
  "name": "string (optional, 2-100 characters)",
  "description": "string (optional, max 500 characters)"
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "company": {
      "id": "string",
      "name": "string",
      "description": "string",
      "createdAt": "ISO 8601 date",
      "updatedAt": "ISO 8601 date",
      "assessmentCount": "number"
    },
    "message": "Company updated successfully"
  }
}
```

#### Error Responses

- `400` - Invalid company ID format or validation error
- `404` - Company not found

---

### Delete Company

**DELETE** `/api/companies/[id]`

Delete a company and all associated assessments (cascade deletion).

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Company ID (MongoDB ObjectId) |

#### Response

```json
{
  "success": true,
  "data": {
    "deletedCompany": true,
    "deletedAssessments": "number",
    "totalAssessments": "number"
  },
  "message": "Company deleted successfully. X associated assessments were also deleted."
}
```

#### Error Responses

- `400` - Invalid company ID format
- `404` - Company not found

---

### Search Companies

**GET** `/api/companies/search`

Search companies by name.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | Yes | Search query |

#### Response

```json
{
  "success": true,
  "data": {
    "companies": [
      {
        "id": "string",
        "name": "string",
        "description": "string",
        "createdAt": "ISO 8601 date",
        "updatedAt": "ISO 8601 date",
        "assessmentCount": "number"
      }
    ],
    "total": "number",
    "query": "string"
  }
}
```

---

## Questionnaire APIs

### Get Questionnaire Sections (Legacy)

**GET** `/api/questionnaires`

Get questionnaire sections by assessment type (legacy endpoint, uses mock data).

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | string | Yes | `exploratory` or `migration` |

#### Response

```json
{
  "success": true,
  "data": {
    "type": "exploratory" | "migration",
    "sections": [
      {
        "id": "string",
        "title": "string",
        "description": "string",
        "questions": [
          {
            "id": "string",
            "type": "string",
            "label": "string",
            "required": "boolean"
          }
        ],
        "stepNumber": "number"
      }
    ]
  },
  "message": "Questionnaire sections retrieved successfully"
}
```

#### Error Responses

- `400` - Assessment type is required or invalid
- `404` - Questionnaire not found for the specified type

---

### Get RAPID Questionnaire

**GET** `/api/questionnaires/rapid`

Retrieve RAPID questionnaire structure.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | string | Yes | `EXPLORATORY` or `MIGRATION` |
| `version` | string | No | Specific questionnaire version |

#### Response

```json
{
  "success": true,
  "data": {
    "version": "string",
    "assessmentType": "EXPLORATORY" | "MIGRATION",
    "totalQuestions": "number",
    "categories": [
      {
        "id": "string",
        "title": "string",
        "description": "string",
        "questionCount": "number",
        "subcategories": [
          {
            "id": "string",
            "title": "string",
            "description": "string",
            "questions": [
              {
                "id": "string",
                "number": "string",
                "text": "string",
                "type": "text" | "textarea" | "select" | "radio" | "checkbox",
                "required": "boolean",
                "options": ["string"],
                "category": "string"
              }
            ]
          }
        ]
      }
    ]
  }
}
```

#### Error Responses

- `400` - Invalid assessment type
- `404` - Questionnaire not found

---

### Initialize RAPID Questionnaires

**GET** `/api/questionnaires/rapid/init`

Check initialization status or validate RAPID questionnaires.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | string | No | `status` (default) or `validate` |

#### Response (status)

```json
{
  "success": true,
  "data": {
    "availability": {
      "exploratory": "boolean",
      "migration": "boolean"
    },
    "initialized": "boolean",
    "message": "string"
  }
}
```

#### Response (validate)

```json
{
  "success": true,
  "data": {
    "validation": {
      "valid": "boolean",
      "issues": ["string"]
    },
    "message": "string"
  }
}
```

---

**POST** `/api/questionnaires/rapid/init`

Initialize RAPID questionnaires in database.

#### Request Body

```json
{
  "action": "init" | "auto-init",
  "force": "boolean (optional, default: false)"
}
```

#### Response (init)

```json
{
  "success": true,
  "data": {
    "success": "boolean",
    "exploratory": {
      "initialized": "boolean",
      "message": "string"
    },
    "migration": {
      "initialized": "boolean",
      "message": "string"
    },
    "message": "string"
  },
  "message": "string"
}
```

#### Response (auto-init)

```json
{
  "success": true,
  "data": {
    "success": "boolean",
    "exploratory": {
      "initialized": "boolean",
      "skipped": "boolean",
      "message": "string"
    },
    "migration": {
      "initialized": "boolean",
      "skipped": "boolean",
      "message": "string"
    },
    "message": "string"
  },
  "message": "string"
}
```

**Note:** `auto-init` only initializes missing questionnaires, while `init` initializes all questionnaires (can be forced with `force: true`).

---

## Report APIs

### List Reports

**GET** `/api/reports`

Retrieve all reports for the authenticated user.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `companyId` | string | No | Filter reports by company ID |

---

### Create Report Request

**POST** `/api/reports`

Create a new report generation request (asynchronous).

#### Request Body

```json
{
  "assessmentId": "string (required)",
  "companyId": "string (required)"
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "requestId": "string",
    "status": "PENDING",
    "estimatedCompletionTime": "ISO 8601 date",
    "message": "Report generation request created"
  }
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "reports": [
      {
        "id": "string",
        "assessmentId": "string",
        "companyId": "string",
        "htmlContent": "string",
        "generatedAt": "ISO 8601 date",
        "metadata": {
          "assessmentType": "string",
          "companyName": "string",
          "generationDuration": "number",
          "bedrockModel": "string"
        }
      }
    ],
    "total": "number"
  }
}
```

---

### Generate Report (Synchronous)

**POST** `/api/reports/generate`

Generate a new report for a completed assessment synchronously using AWS Bedrock.

#### Request Body

```json
{
  "assessmentId": "string (required)",
  "companyId": "string (required)"
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "reportId": "string",
    "message": "Report generated successfully",
    "htmlContent": "string"
  }
}
```

#### Error Responses

- `400` - Assessment ID and Company ID are required, or assessment not completed
- `401` - Invalid AWS credentials
- `403` - Access denied (AWS permissions)
- `404` - Assessment or company not found
- `409` - Report already exists for this assessment
- `429` - Request throttled
- `500` - Report generation failed

---

### Get Report

**GET** `/api/reports/[id]`

Retrieve a specific report by ID.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Report ID |

#### Response

```json
{
  "success": true,
  "data": {
    "report": {
      "id": "string",
      "assessmentId": "string",
      "companyId": "string",
      "htmlContent": "string",
      "generatedAt": "ISO 8601 date",
      "metadata": {
        "assessmentType": "string",
        "companyName": "string",
        "generationDuration": "number",
        "bedrockModel": "string"
      }
    }
  }
}
```

---

## AWS Integration APIs

### Test AWS Bedrock

**POST** `/api/aws/test-bedrock`

Test AWS Bedrock connection and credentials.

#### Request Body

```json
{
  "accessKeyId": "string (required)",
  "secretAccessKey": "string (required)",
  "region": "string (required)"
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "message": "AWS Bedrock connection successful",
    "region": "string",
    "model": "string"
  }
}
```

---

### Save AWS Credentials

**POST** `/api/aws/credentials`

Save AWS credentials for a company (encrypted).

#### Request Body

```json
{
  "companyId": "string (required)",
  "accessKeyId": "string (required)",
  "secretAccessKey": "string (required)",
  "region": "string (required)"
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "message": "AWS credentials saved successfully"
  }
}
```

---

## Database APIs

### Initialize Database

**GET** `/api/db/init`

Check database initialization status.

#### Response

```json
{
  "success": true,
  "data": {
    "initialized": "boolean",
    "collections": ["string"],
    "message": "string"
  }
}
```

---

**POST** `/api/db/init`

Initialize database collections and indexes.

#### Response

```json
{
  "success": true,
  "data": {
    "message": "Database initialized successfully",
    "collectionsCreated": ["string"],
    "indexesCreated": "number"
  }
}
```

---

## Error Handling

All API endpoints implement comprehensive error handling:

1. **Validation Errors (400)**: Invalid input data or missing required fields
2. **Authentication Errors (401)**: Invalid or missing authentication credentials
3. **Authorization Errors (403)**: Insufficient permissions
4. **Not Found Errors (404)**: Resource not found
5. **Conflict Errors (409)**: Resource already exists or conflict state
6. **Rate Limiting (429)**: Too many requests
7. **Server Errors (500)**: Internal server errors

Error responses include detailed messages to help diagnose issues.

---

## Rate Limiting

API endpoints may implement rate limiting to prevent abuse. When rate limits are exceeded, the API returns a `429 Too Many Requests` status code.

---

## Versioning

The API is currently unversioned. Future versions may include versioning in the URL path (e.g., `/api/v1/assessments`).

---

## Support

For API support or questions, please refer to the main project documentation or contact the development team.
