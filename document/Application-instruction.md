# Application Development Instructions

## 🎯 **Business Data Platform - Core Coding Rules**

This document contains the essential coding rules for the Business Data Platform. **MANDATORY READING** before making any code modifications.

---

## 🚨 **CORE CODING RULES - NO EXCEPTIONS**

### **Rule 1: NextJS Core Application**
- **Application MUST use NextJS as the core framework**
- **No other frameworks or build tools allowed**
- **Follow NextJS best practices and patterns**

### **Rule 2: Directory Structure & Separation**
- **`components/` directory**: UI components ONLY - NO business logic
- **`containers/` directory**: Application flow and business logic ONLY - NO UI rendering
- **NEVER mix concerns between components and containers**
- **NEVER put business logic in UI components**
- **NEVER put UI rendering in containers**

### **Rule 3: File Size Limitation**
- **Each file MUST NOT exceed 400-500 lines**
- **If a file exceeds the limit:**
  - Create smaller functions within the file, OR
  - Extract code to separate files and import them
- **Purpose**: Keep files small and manageable to avoid affecting other code

### **Rule 4: Time Handling**
- **Any updates about time MUST use local machine time**
- **NEVER use server time or UTC time for user-facing updates**
- **Use JavaScript Date() or browser time APIs for local time**
- **Purpose**: Ensure users see time in their local timezone

---

## 📁 **File Organization Example**

```
src/
├── components/           # UI ONLY - NO LOGIC
│   ├── Button.tsx       # Pure UI component
│   ├── Form.tsx         # Pure UI component
│   └── Layout.tsx       # Pure UI component
├── containers/           # LOGIC ONLY - NO UI
│   ├── UserLogic.tsx    # Business logic only
│   ├── DataFlow.tsx     # Application flow only
│   └── StateManager.tsx # State management only
└── lib/                 # Utility functions
    ├── helpers.ts       # Helper functions
    └── validators.ts    # Validation functions
```

---

## ❌ **What NOT to Do**

- ❌ **NEVER** put business logic in components
- ❌ **NEVER** put UI rendering in containers
- ❌ **NEVER** create files larger than 500 lines
- ❌ **NEVER** mix UI and logic concerns
- ❌ **NEVER** use frameworks other than NextJS
- ❌ **NEVER** use server time or UTC time for user-facing updates

---

## ✅ **What TO Do**

- ✅ **ALWAYS** keep components pure UI only
- ✅ **ALWAYS** keep containers logic only
- ✅ **ALWAYS** keep files under 500 lines
- ✅ **ALWAYS** extract large functions to separate files
- ✅ **ALWAYS** use NextJS as the core framework
- ✅ **ALWAYS** use local machine time for user-facing updates

---

## 🔍 **Code Review Checklist**

Before committing any code, verify:
- [ ] File is under 500 lines
- [ ] Components contain only UI code
- [ ] Containers contain only business logic
- [ ] No mixed concerns between layers
- [ ] NextJS patterns followed correctly

---

**Last Updated**: 2025-08-14 14:51:33 +07 - Simplified to core coding rules
**Purpose**: Provide essential coding rules for the Business Data Platform
**Audience**: All developers working on the Business Data Platform
**Compliance**: Mandatory for all code modifications