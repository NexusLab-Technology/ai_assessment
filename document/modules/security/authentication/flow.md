# Authentication Module - Flow

## Authentication Flow Diagrams

### Login Flow

```
User enters credentials
    ↓
LoginPage validates input
    ↓
[Invalid] → Display validation errors
    ↓
[Valid] → Call AuthContext.login()
    ↓
AuthProviderRegistry.authenticate()
    ↓
Execute beforeAuthenticate hooks
    ↓
Try registered providers (priority order)
    ↓
[Success] → Generate session token
    ↓
Save session to localStorage & cookies
    ↓
Execute afterAuthenticate hooks
    ↓
Sync with external auth systems
    ↓
Update AuthContext state
    ↓
Redirect to default route or returnUrl
    ↓
[Failure] → Display error message
```

### Logout Flow

```
User clicks logout
    ↓
Call AuthContext.logout()
    ↓
Execute beforeLogout hooks
    ↓
Clear session from localStorage
    ↓
Clear cookies
    ↓
Sync with external auth systems
    ↓
Execute afterLogout hooks
    ↓
Update AuthContext state (isAuthenticated = false)
    ↓
Redirect to login page
```

### Session Validation Flow

```
App initialization
    ↓
AuthProvider mounts
    ↓
Check localStorage for session
    ↓
[No session] → Set isAuthenticated = false
    ↓
[Session found] → Parse session data
    ↓
Validate session structure
    ↓
[Invalid] → Clear session, set isAuthenticated = false
    ↓
[Valid] → Check expiration
    ↓
[Expired] → Clear session, set isAuthenticated = false
    ↓
[Valid] → Execute beforeValidateSession hooks
    ↓
Load user data from localStorage
    ↓
Execute afterValidateSession hooks
    ↓
Set isAuthenticated = true
    ↓
Set up periodic expiration check
```

### Route Protection Flow

```
User navigates to protected route
    ↓
RouteGuard component mounts
    ↓
Check ConfigManager.isAuthEnabled()
    ↓
[Auth disabled] → Render children immediately
    ↓
[Auth enabled] → Check requireAuth prop
    ↓
[requireAuth = false] → Render children
    ↓
[requireAuth = true] → Check AuthContext.loading
    ↓
[Loading] → Show loading spinner
    ↓
[Not loading] → Check AuthContext.isAuthenticated
    ↓
[Not authenticated] → Store returnUrl
    ↓
Redirect to /login?returnUrl={path}
    ↓
[Authenticated] → Render protected content
```

### Provider Authentication Flow

```
AuthProviderRegistry.authenticate(credentials)
    ↓
Get enabled providers sorted by priority
    ↓
For each provider (high to low priority):
    ↓
    Try provider.authenticate(credentials)
    ↓
    [Success] → Return success with user & session
    ↓
    [Failure] → Try next provider
    ↓
[All providers failed] → Try mock authentication
    ↓
[Still failed] → Return error
```

## State Transitions

### Authentication State Machine

```
┌─────────────┐
│  UNAUTHENTICATED  │
└──────┬──────┘
       │ login()
       ↓
┌─────────────┐
│   LOADING   │
└──────┬──────┘
       │
       ├─[Success]→┌─────────────┐
       │           │ AUTHENTICATED │
       │           └──────┬──────┘
       │                 │ logout()
       │                 ↓
       │           ┌─────────────┐
       │           │  UNAUTHENTICATED  │
       │           └──────────────────┘
       │
       └─[Failure]→┌─────────────┐
                   │  UNAUTHENTICATED  │
                   └──────────────────┘
```

### Session Lifecycle

```
Session Created
    ↓
Active (valid token, not expired)
    ↓
Periodic expiration check
    ↓
[Not expired] → Continue active
    ↓
[Expired] → Session Expired
    ↓
Auto logout
    ↓
Session Cleared
```

## Data Flow

### Login Data Flow

```
LoginPage Component
    ↓ (credentials)
AuthContext.login()
    ↓ (credentials)
AuthProviderRegistry.authenticate()
    ↓ (credentials)
AuthProvider.authenticate()
    ↓ (user, session)
AuthContext.saveSession()
    ↓ (session data)
localStorage.setItem()
    ↓ (session data)
document.cookie
    ↓
AuthContext.setState({ isAuthenticated: true })
    ↓
React re-renders with authenticated state
```

### Session Persistence Flow

```
Browser Refresh
    ↓
AuthProvider mounts
    ↓
AuthContext.loadSession()
    ↓
localStorage.getItem('session_data')
    ↓
Parse JSON
    ↓
Validate structure
    ↓
Check expiration
    ↓
[Valid] → Restore session
    ↓
[Invalid/Expired] → Clear session
```

## Hook Execution Flow

### Authentication Hooks

```
beforeAuthenticate hooks
    ↓ (credentials)
[Modify credentials] → Continue with modified
[Block] → Return error
    ↓
Provider authentication
    ↓
afterAuthenticate hooks
    ↓ (user, session)
[Success] → Continue
```

### Logout Hooks

```
beforeLogout hooks
    ↓ (user, session)
[Allow] → Continue
[Block] → Cancel logout
    ↓
Clear session
    ↓
afterLogout hooks
    ↓ (userId)
[Complete] → Logout finished
```

### Session Validation Hooks

```
beforeValidateSession hooks
    ↓ (token)
[Modify/Validate token] → Continue
[Block] → Invalidate session
    ↓
Load user data
    ↓
afterValidateSession hooks
    ↓ (user, session)
[Complete] → Session validated
```

## Error Handling Flow

```
Error occurs
    ↓
Catch error
    ↓
Log error (console.error)
    ↓
Determine error type
    ↓
[Network error] → Display "Connection error"
[Invalid credentials] → Display "Invalid username or password"
[Session expired] → Auto logout
[Provider error] → Try next provider
[Unknown error] → Display generic error
    ↓
Update error state
    ↓
User sees error message
```
