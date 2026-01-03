# Basic Setup Example

This example demonstrates how to set up the Configurable Authentication Framework in a Next.js application.

## Project Structure

```
my-app/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with AuthWrapper
│   │   ├── page.tsx            # Protected dashboard page
│   │   ├── login/
│   │   │   └── page.tsx        # Login page
│   │   ├── about/
│   │   │   └── page.tsx        # Public page
│   │   └── profile/
│   │       └── page.tsx        # Protected profile page
│   ├── components/
│   │   ├── AuthWrapper.tsx     # Authentication wrapper
│   │   ├── ApplicationShell.tsx # Main layout with sidebar
│   │   ├── RouteGuard.tsx      # Route protection component
│   │   └── LoginPage.tsx       # Login form component
│   └── contexts/
│       └── AuthContext.tsx     # Authentication context
├── .env.local                  # Environment configuration
└── middleware.ts               # Server-side route protection
```

## Step 1: Environment Configuration

Create a `.env.local` file in your project root:

```bash
# Authentication Configuration
AUTH_ENABLED=true
SESSION_TIMEOUT=3600000
REMEMBER_SIDEBAR=true

# Development Settings
DEBUG_AUTH=false
MOCK_AUTH=false

# Security Settings (Production)
SECURE_COOKIES=true
COOKIE_SAME_SITE=lax
```

## Step 2: Root Layout Setup

```tsx
// src/app/layout.tsx
import { AuthWrapper } from '@/components/AuthWrapper'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthWrapper>
          {children}
        </AuthWrapper>
      </body>
    </html>
  )
}
```

## Step 3: Protected Dashboard Page

```tsx
// src/app/page.tsx
import { ApplicationShell } from '@/components/ApplicationShell'
import { RouteGuard } from '@/components/RouteGuard'

export default function Dashboard() {
  return (
    <RouteGuard requireAuth={true}>
      <ApplicationShell>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
          <p>This is a protected page that requires authentication.</p>
        </div>
      </ApplicationShell>
    </RouteGuard>
  )
}
```

## Step 4: Public Page

```tsx
// src/app/about/page.tsx
import { ApplicationShell } from '@/components/ApplicationShell'
import { RouteGuard } from '@/components/RouteGuard'

export default function About() {
  return (
    <RouteGuard requireAuth={false}>
      <ApplicationShell>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">About</h1>
          <p>This is a public page accessible without authentication.</p>
        </div>
      </ApplicationShell>
    </RouteGuard>
  )
}
```

## Step 5: Login Page

```tsx
// src/app/login/page.tsx
import { LoginPage } from '@/components/LoginPage'

export default function Login() {
  return <LoginPage />
}
```

## Step 6: Server-Side Middleware

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Get authentication configuration
  const authEnabled = process.env.AUTH_ENABLED?.toLowerCase() !== 'false'
  
  // If authentication is disabled, allow all requests
  if (!authEnabled) {
    return NextResponse.next()
  }

  // Define public routes
  const publicRoutes = ['/login', '/about', '/api/auth']
  
  // Check if current path is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname.startsWith(route)
  )
  
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Check for session
  const sessionToken = request.cookies.get('auth_token')?.value
  const sessionData = request.cookies.get('session_data')?.value
  
  if (!sessionToken || !sessionData) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('returnUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Validate session expiration
  try {
    const session = JSON.parse(sessionData)
    const expiresAt = new Date(session.expiresAt)
    
    if (expiresAt <= new Date()) {
      const loginUrl = new URL('/login', request.url)
      const response = NextResponse.redirect(loginUrl)
      
      // Clear expired cookies
      response.cookies.delete('auth_token')
      response.cookies.delete('session_data')
      response.cookies.delete('user_data')
      
      return response
    }
    
    return NextResponse.next()
  } catch (error) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
```

## Step 7: Custom Navigation Configuration

```tsx
// src/components/CustomNavigation.tsx
import { NavigationItem } from '@/types'
import { ApplicationShell } from '@/components/ApplicationShell'

const customNavigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/',
    icon: '🏠',
  },
  {
    id: 'profile',
    label: 'Profile',
    href: '/profile',
    icon: '👤',
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/settings',
    icon: '⚙️',
  },
  {
    id: 'about',
    label: 'About',
    href: '/about',
    icon: 'ℹ️',
  }
]

export function CustomLayout({ children }: { children: React.ReactNode }) {
  return (
    <ApplicationShell navigationItems={customNavigationItems}>
      {children}
    </ApplicationShell>
  )
}
```

## Step 8: Using Authentication Hooks

```tsx
// src/components/UserProfile.tsx
'use client'

import { useAuth } from '@/contexts/AuthContext'

export function UserProfile() {
  const { user, isAuthenticated, loading, logout } = useAuth()

  if (loading) {
    return <div>Loading...</div>
  }

  if (!isAuthenticated) {
    return <div>Please log in to view your profile.</div>
  }

  return (
    <div>
      <h2>Welcome, {user?.username}!</h2>
      <p>Email: {user?.email}</p>
      <p>Roles: {user?.roles.join(', ')}</p>
      <button onClick={logout}>Logout</button>
    </div>
  )
}
```

## Step 9: Conditional Rendering

```tsx
// src/components/ConditionalContent.tsx
'use client'

import { useAuth } from '@/contexts/AuthContext'
import { ConfigManager } from '@/lib/config'

export function ConditionalContent() {
  const { isAuthenticated, user } = useAuth()
  const config = ConfigManager.getAuthConfig()

  return (
    <div>
      {/* Always visible content */}
      <h1>Welcome to our application</h1>
      
      {/* Content visible when auth is disabled */}
      {!config.authEnabled && (
        <p>Authentication is disabled. All features are available.</p>
      )}
      
      {/* Content visible when authenticated */}
      {config.authEnabled && isAuthenticated && (
        <div>
          <p>Hello, {user?.username}!</p>
          <p>You have access to protected features.</p>
        </div>
      )}
      
      {/* Content visible when not authenticated */}
      {config.authEnabled && !isAuthenticated && (
        <div>
          <p>Please log in to access protected features.</p>
          <a href="/login">Go to Login</a>
        </div>
      )}
    </div>
  )
}
```

## Step 10: Testing the Setup

### Test Authentication Enabled

1. Set `AUTH_ENABLED=true` in `.env.local`
2. Start your application: `npm run dev`
3. Navigate to `/` - should redirect to `/login`
4. Log in with credentials: `admin` / `password`
5. Should redirect back to dashboard
6. Navigate to `/about` - should be accessible without login

### Test Authentication Disabled

1. Set `AUTH_ENABLED=false` in `.env.local`
2. Restart your application
3. Navigate to `/` - should show dashboard without login
4. All routes should be accessible
5. No authentication UI should be visible

## Common Issues and Solutions

### Issue: "useAuth must be used within an AuthProvider"

**Solution:** Ensure your app is wrapped with `AuthWrapper`:

```tsx
// Make sure this is in your root layout
<AuthWrapper>
  <YourApp />
</AuthWrapper>
```

### Issue: Infinite redirect loops

**Solution:** Check that your login page is not protected:

```tsx
// Login page should not require auth
<RouteGuard requireAuth={false}>
  <LoginPage />
</RouteGuard>
```

### Issue: Session not persisting

**Solution:** Check localStorage and session timeout:

```bash
# Increase session timeout (in milliseconds)
SESSION_TIMEOUT=7200000  # 2 hours
```

### Issue: Sidebar state not saving

**Solution:** Enable sidebar persistence:

```bash
REMEMBER_SIDEBAR=true
```

## Next Steps

1. **Customize Styling**: Modify the CSS classes in components to match your design
2. **Add Real Authentication**: Replace mock authentication with your auth provider
3. **Configure External Integration**: Set up integration with Auth0, Firebase, etc.
4. **Add Role-Based Access**: Implement role-based route protection
5. **Set Up Testing**: Add unit and integration tests for your authentication flow

## Complete Example Repository

For a complete working example, see the framework's example implementation in the main repository.