# Company Settings Module - Flow

## Company Creation Flow

```
User clicks "Create New Company"
    ↓
Display CompanyForm
    ↓
User enters name and description
    ↓
Validate input
    ↓
[Invalid] → Show errors
    ↓
[Valid] → Save to MongoDB
    ↓
Show success message
    ↓
Return to company list
```

## Company Management Flow

See `.kiro/specs/company-settings/design.md` for complete flow diagrams.
