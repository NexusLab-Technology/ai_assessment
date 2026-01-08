# AI Assessment Module - Flow

## Assessment Creation Flow

```
User selects company
    ↓
Click "Create New Assessment"
    ↓
Enter assessment name
    ↓
Select path (Exploratory/Migration)
    ↓
Initialize assessment with categories
    ↓
Navigate to first category
```

## Assessment Completion Flow

```
User navigates categories
    ↓
Answer questions in category
    ↓
Auto-save every 30 seconds
    ↓
Navigate to next category
    ↓
Complete all categories
    ↓
Click "Review All Responses"
    ↓
Review and edit if needed
    ↓
Click "Complete Assessment"
    ↓
Mark assessment as COMPLETED
    ↓
Generate report (async)
```

## Report Generation Flow [Report Generation]

```
User completes assessment
    ↓
Click "Generate Report"
    ↓
Send request to External API Gateway
    ↓
Receive request ID
    ↓
Create report request record in MongoDB (status: PENDING)
    ↓
Poll MongoDB for status updates
    ↓
[PENDING] → Show pending status
    ↓
[PROCESSING] → Show progress
    ↓
[COMPLETED] → Show report
    ↓
[FAILED] → Show error + retry option
```

## Category Navigation Flow

```
User clicks category in sidebar
    ↓
Save current category responses
    ↓
Load selected category
    ↓
Display questions in fixed container
    ↓
Update progress indicators
    ↓
Highlight active category
```

## Assessment Status-based Navigation Flow [Assessment Status UI]

```
User views assessment list
    ↓
Check assessment status
    ↓
[Incomplete] → Show edit icon
    ↓
[Completed] → Show view icon
    ↓
User clicks icon
    ↓
[Edit icon] → Navigate to edit mode (AssessmentWizard)
    ↓
[View icon] → Open AssessmentViewer (read-only)
```

## Assessment Viewer Flow [Assessment Status UI]

```
User clicks view icon on completed assessment
    ↓
Load assessment data
    ↓
Organize responses by session
    ↓
Sort sessions chronologically
    ↓
Display sessions with metadata
    ↓
Show all questions and answers (read-only)
    ↓
User can close or switch to edit mode
```

## Auto-save Flow

```
User enters response
    ↓
Start 30-second timer
    ↓
[30 seconds elapsed] → Save to MongoDB
    ↓
[User navigates away] → Save immediately
    ↓
[User closes browser] → Save on beforeunload
```

## Response Review Flow

```
User reaches final category
    ↓
Click "Review All Responses"
    ↓
Load all responses by category
    ↓
Display comprehensive summary
    ↓
Highlight unanswered required questions
    ↓
User can click question to navigate and edit
    ↓
Return to final step
    ↓
Enable "Complete Assessment" if all required filled
```

## Report Status Polling Flow [Report Generation]

```
Report generation requested
    ↓
Set up polling interval (every 5 seconds)
    ↓
Query MongoDB for report request status
    ↓
[Status changed] → Update UI
    ↓
[COMPLETED] → Stop polling, show report
    ↓
[FAILED] → Stop polling, show error + retry
    ↓
[Still PENDING/PROCESSING] → Continue polling
```

## Error Handling Flow

```
Error occurs
    ↓
Catch error
    ↓
Determine error type
    ↓
[Network error] → Show retry option
[Validation error] → Show field-specific errors
[Save error] → Show save failed message
[Load error] → Show loading error
    ↓
Log error for debugging
    ↓
User sees error message with recovery options
```
