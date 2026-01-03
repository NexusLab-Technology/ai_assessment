# Project Structure - Configurable Authentication Framework

## Overview
This is a NextJS 14+ project with TypeScript implementing a configurable authentication framework with collapsible sidebar navigation.

## Current Status
- ✅ Configurable Authentication Framework - COMPLETED (14/14 tasks)
- ✅ Sidebar Settings UI Update - COMPLETED (9/9 tasks)

## Project Architecture

### Core Components
- **Authentication System**: Complete with configurable behavior
- **Sidebar Navigation**: Collapsible with settings-based navigation
- **Route Protection**: Client and server-side protection
- **Settings Page**: Profile information display

### Directory Structure
```
src/
├── app/                    # NextJS App Router pages
│   ├── login/             # Login page
│   ├── settings/          # Settings page (replaces profile)
│   └── layout.tsx         # Root layout with AuthProvider
├── components/            # React components
│   ├── ApplicationShell.tsx  # Main layout with sidebar
│   ├── LoginPage.tsx      # Login form component
│   ├── RouteGuard.tsx     # Route protection component
│   └── Sidebar.tsx        # Collapsible sidebar navigation
├── contexts/              # React contexts
│   └── AuthContext.tsx    # Authentication context and provider
├── hooks/                 # Custom React hooks
├── interfaces/            # TypeScript interfaces
├── lib/                   # Utility libraries
│   ├── AuthProviderRegistry.ts  # External auth integration
│   ├── config.ts          # Environment configuration
│   └── constants.ts       # Navigation and app constants
├── middleware/            # NextJS middleware
├── providers/             # Additional providers
├── types/                 # TypeScript type definitions
└── __tests__/             # Comprehensive test suite
    ├── integration/       # Integration tests
    ├── properties/        # Property-based tests
    └── unit/              # Unit tests

.kiro/specs/               # Feature specifications
├── configurable-auth-framework/  # Auth framework spec
└── sidebar-settings-ui-update/   # UI update spec

docs/                      # Documentation
├── api/                   # API documentation
├── examples/              # Usage examples
├── modules/               # Module-specific docs
└── testing/               # Testing documentation
```

## Key Features Implemented
1. **Environment-based Authentication Control**
2. **Configurable Session Management**
3. **Route Protection (Client & Server)**
4. **Collapsible Sidebar Navigation**
5. **Settings-based UI (Profile → Settings)**
6. **External System Integration Support**
7. **Comprehensive Testing (242 tests passing)**
8. **Complete Documentation**

## Technology Stack
- NextJS 14+ with App Router
- TypeScript
- React 18
- TailwindCSS
- Jest + Testing Library
- Fast-check (Property-based testing)

## Current State
All major features are implemented and tested. The project is ready for production use with comprehensive authentication and navigation systems.