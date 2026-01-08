# Module Documentation

## Module Organization

Modules are organized into logical groups based on functionality:

### 1. AI Assessment Group
The core assessment functionality, including all assessment-related features:

- **[AI Assessment](./ai-assessment/README.md)** - Main assessment module with RAPID questionnaire
  - Includes Assessment Status UI functionality (status indicators and viewer)
  - Includes Report Generation functionality (async report generation)

### 2. Security Group
Authentication and route protection:

- **[Authentication](./security/authentication/README.md)** - Configurable authentication framework
- **[Route Protection](./security/route-protection/README.md)** - Route protection based on auth state

### 3. Supporting Modules
Supporting functionality:

- **[Company Settings](./supporting/company-settings/README.md)** - Company management
- **[Sidebar Navigation](./supporting/sidebar-navigation/README.md)** - Navigation sidebar

## Module Structure

Each module contains exactly 6 files:
- `README.md` - Module overview and quick start
- `requirement.md` - Requirements and acceptance criteria
- `structure.md` - File structure and component organization
- `flow.md` - Data flow and user workflows
- `feature.md` - Feature descriptions and capabilities
- `checklist.md` - Implementation checklist

**Note**: Sub-modules are consolidated into their parent modules. Each module has a single set of 6 documentation files that include all related functionality.

## Directory Structure

```
document/modules/
├── ai-assessment/          # AI Assessment Group (1 module)
│   ├── README.md
│   ├── requirement.md
│   ├── structure.md
│   ├── flow.md
│   ├── feature.md
│   └── checklist.md
├── security/               # Security Group (2 modules)
│   ├── authentication/
│   │   ├── README.md
│   │   ├── requirement.md
│   │   ├── structure.md
│   │   ├── flow.md
│   │   ├── feature.md
│   │   └── checklist.md
│   └── route-protection/
│       ├── README.md
│       ├── requirement.md
│       ├── structure.md
│       ├── flow.md
│       ├── feature.md
│       └── checklist.md
└── supporting/            # Supporting Modules (2 modules)
    ├── company-settings/
    │   ├── README.md
    │   ├── requirement.md
    │   ├── structure.md
    │   ├── flow.md
    │   ├── feature.md
    │   └── checklist.md
    └── sidebar-navigation/
        ├── README.md
        ├── requirement.md
        ├── structure.md
        ├── flow.md
        ├── feature.md
        └── checklist.md
```

## Quick Navigation

### By Functionality
- **Assessment Features**: [AI Assessment](./ai-assessment/README.md)
- **Security**: [Authentication](./security/authentication/README.md), [Route Protection](./security/route-protection/README.md)
- **Management**: [Company Settings](./supporting/company-settings/README.md)
- **UI Components**: [Sidebar Navigation](./supporting/sidebar-navigation/README.md)

### By Module Group
1. **AI Assessment Group**: [AI Assessment](./ai-assessment/README.md)
2. **Security Group**: 
   - [Authentication](./security/authentication/README.md)
   - [Route Protection](./security/route-protection/README.md)
3. **Supporting Modules**:
   - [Company Settings](./supporting/company-settings/README.md)
   - [Sidebar Navigation](./supporting/sidebar-navigation/README.md)

## Total Modules

**3 module groups** with **5 modules** total:
- **AI Assessment Group**: 1 module
- **Security Group**: 2 modules
- **Supporting Modules**: 2 modules

**Total documentation files**: 30 files (6 files × 5 modules)
