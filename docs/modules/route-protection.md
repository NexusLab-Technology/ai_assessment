# Route Protection Module

The Route Protection Module provides comprehensive route guarding capabilities with both client-side and server-side protection, middleware integration, and flexible authentication requirements.

## Overview

The Route Protection Module ensures that protected routes are only accessible to authenticated users while providing seamless navigation for public routes. It integrates with the authentication system to provide consistent protection across both client-side routing and server-side rendering.

### Key Features

- **Client-Side Route Protection** - RouteGuard component for protecting React components
- **Server-Side Middleware** - Next.js middleware for server-side route protection
- **Flexible Authentication Requirements** - Configurable auth requirements per route
- **Automatic Redirects** - Seamless redirects to login page for unauthenticated users
- **SSR Consistency** - Consistent protection between server and client
- **Role-Based Access** - Support for role-based route protection
- **Non-Interference** - Complete bypass when authentication is disabled

## Components

### RouteGuard

The primary client-side route protection component.

```tsx
import { RouteGuard } from '@/components/RouteGuard';

function ProtectedPage() {
  return (
    <RouteGuard requireAuth={true}>
      <div>This content requires authentication</div>
    </RouteGuard>
  );
}

function PublicPage() {
  return (
    <RouteGuard requireAuth={false}>
      <div>This content is public</div>
    </RouteGuard>
  );
}
```

**Props:**
- `children: React.ReactNode` - Content to protect
- `requireAuth?: boolean` - Whether authentication is required (default: true)
- `roles?: string[]` - Required user roles for access
- `fallback?: React.ReactNode` - Custom fallback component
- `redirectTo?: string` - Custom redirect path for unauthenticated users
- `loadingComponent?: React.ReactNode` - Custom loading component

**Features:**
- Automatic authentication checking
- Loading states during auth verification
- Conditional rendering based on auth state
- Role-based access control
- Custom fallback components
- Integration with authentication context

### Advanced RouteGuard Usage

```tsx
// Role-based protection
<RouteGuard requireAuth={true} roles={['admin', 'moderator']}>
  <AdminPanel />
</RouteGuard>

// Custom fallback
<RouteGuard 
  requireAuth={true}
  fallback={<div>Please log in to access this content</div>}
>
  <ProtectedContent />
</RouteGuard>

// Custom loading component
<RouteGuard 
  requireAuth={true}
  loadingComponent={<CustomSpinner />}
>
  <ProtectedContent />
</RouteGuard>

// Custom redirect
<RouteGuard 
  requireAuth={true}
  redirectTo="/custom-login"
>
  <ProtectedContent />
</RouteGuard>
```

## Server-Side Middleware

### Authentication Middleware

Next.js middleware for server-side route protection.

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get authentication configuration
  const authEnabled = process.env.AUTH_ENABLED?.toLowerCase() !== 'false';
  
  // If authentication is disabled, allow all requests
  if (!authEnabled) {
    return NextResponse.next();
  }

  // Define public routes
  const publicRoutes = ['/login', '/about', '/help', '/api/auth'];
  
  // Check if current path is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Validate session
  const sessionToken = request.cookies.get('auth_token')?.value;
  const sessionData = request.cookies.get('session_data')?.value;
  
  if (!sessionToken || !sessionData) {
    return redirectToLogin(request, pathname);
  }

  // Validate session expiration
  try {
    const session = JSON.parse(sessionData);
    const expiresAt = new Date(session.expiresAt);
    
    if (expiresAt <= new Date()) {
      return redirectToLogin(request, pathname, true); // Clear expired cookies
    }
    
    return NextResponse.next();
  } catch (error) {
    return redirectToLogin(request, pathname, true);
  }
}

function redirectToLogin(
  request: NextRequest, 
  returnUrl: string, 
  clearCookies = false
) {
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('returnUrl', returnUrl);
  
  const response = NextResponse.redirect(loginUrl);
  
  if (clearCookies) {
    response.cookies.delete('auth_token');
    response.cookies.delete('session_data');
    response.cookies.delete('user_data');
  }
  
  return response;
}

// Middleware configuration
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
```

### Advanced Middleware Configuration

```typescript
// Role-based middleware protection
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Define route protection rules
  const protectionRules = [
    {
      pattern: /^\/admin/,
      requireAuth: true,
      roles: ['admin']
    },
    {
      pattern: /^\/dashboard/,
      requireAuth: true,
      roles: ['user', 'admin']
    },
    {
      pattern: /^\/api\/admin/,
      requireAuth: true,
      roles: ['admin']
    }
  ];
  
  // Find matching rule
  const rule = protectionRules.find(rule => rule.pattern.test(pathname));
  
  if (rule) {
    return enforceProtectionRule(request, rule);
  }
  
  return NextResponse.next();
}

async function enforceProtectionRule(
  request: NextRequest, 
  rule: ProtectionRule
) {
  if (!rule.requireAuth) {
    return NextResponse.next();
  }
  
  const session = await validateSession(request);
  
  if (!session) {
    return redirectToLogin(request, request.nextUrl.pathname);
  }
  
  if (rule.roles && !hasRequiredRole(session.user, rule.roles)) {
    return new NextResponse('Forbidden', { status: 403 });
  }
  
  return NextResponse.next();
}
```

## Route Configuration

### Route Protection Patterns

```tsx
// Page-level protection
export default function ProtectedPage() {
  return (
    <RouteGuard requireAuth={true}>
      <PageContent />
    </RouteGuard>
  );
}

// Layout-level protection
export default function ProtectedLayout({ children }) {
  return (
    <RouteGuard requireAuth={true}>
      <Layout>
        {children}
      </Layout>
    </RouteGuard>
  );
}

// Component-level protection
function ConditionalContent() {
  return (
    <div>
      <PublicContent />
      <RouteGuard requireAuth={true}>
        <PrivateContent />
      </RouteGuard>
    </div>
  );
}
```

### Route Configuration Object

```tsx
interface RouteConfig {
  path: string;
  requireAuth: boolean;
  roles?: string[];
  redirect?: string;
  middleware?: boolean;
}

const routeConfigs: RouteConfig[] = [
  {
    path: '/',
    requireAuth: false
  },
  {
    path: '/login',
    requireAuth: false
  },
  {
    path: '/dashboard',
    requireAuth: true
  },
  {
    path: '/admin',
    requireAuth: true,
    roles: ['admin'],
    middleware: true
  },
  {
    path: '/profile',
    requireAuth: true,
    redirect: '/login?returnUrl=/profile'
  }
];
```

## Authentication Integration

### Integration with AuthContext

```tsx
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

function RouteGuard({ 
  children, 
  requireAuth = true, 
  roles = [],
  fallback,
  redirectTo = '/login'
}) {
  const { isAuthenticated, user, loading } = useAuth();
  const router = useRouter();
  const config = ConfigManager.getAuthConfig();
  
  // When authentication is disabled, always allow access
  if (!config.authEnabled) {
    return <>{children}</>;
  }
  
  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  // Check authentication requirement
  if (requireAuth && !isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    // Redirect to login
    const currentPath = window.location.pathname;
    const loginUrl = `${redirectTo}?returnUrl=${encodeURIComponent(currentPath)}`;
    router.push(loginUrl);
    return null;
  }
  
  // Check role requirements
  if (requireAuth && roles.length > 0 && user) {
    const hasRequiredRole = roles.some(role => user.roles.includes(role));
    if (!hasRequiredRole) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600">
              You don't have permission to access this page.
            </p>
          </div>
        </div>
      );
    }
  }
  
  // Render protected content
  return <>{children}</>;
}
```

### Conditional Auth Hook Integration

```tsx
import { useConditionalAuth } from '@/hooks/useConditionalAuth';

function FlexibleRouteGuard({ children, requireAuth = true }) {
  const auth = useConditionalAuth();
  
  // When auth is disabled, always render children
  if (!auth) {
    return <>{children}</>;
  }
  
  const { isAuthenticated, loading } = auth;
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (requireAuth && !isAuthenticated) {
    return <LoginPrompt />;
  }
  
  return <>{children}</>;
}
```

## API Routes Protection

### Protecting API Routes

```typescript
// pages/api/protected/route.ts or app/api/protected/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  // Check authentication
  const session = await validateSession(request);
  
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  
  // Check roles if needed
  if (!session.user.roles.includes('admin')) {
    return new NextResponse('Forbidden', { status: 403 });
  }
  
  // Return protected data
  return NextResponse.json({ data: 'Protected data' });
}

// Utility function for session validation
async function validateSession(request: NextRequest) {
  const authToken = request.cookies.get('auth_token')?.value;
  const sessionData = request.cookies.get('session_data')?.value;
  
  if (!authToken || !sessionData) {
    return null;
  }
  
  try {
    const session = JSON.parse(sessionData);
    
    // Check expiration
    if (new Date(session.expiresAt) <= new Date()) {
      return null;
    }
    
    // Validate with provider if needed
    const isValid = await validateWithProvider(authToken);
    if (!isValid) {
      return null;
    }
    
    return session;
  } catch (error) {
    return null;
  }
}
```

### API Route Middleware

```typescript
// lib/api-middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function withAuth(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: { roles?: string[] } = {}
) {
  return async (request: NextRequest) => {
    const session = await validateSession(request);
    
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    
    if (options.roles && !hasRequiredRole(session.user, options.roles)) {
      return new NextResponse('Forbidden', { status: 403 });
    }
    
    // Add session to request context
    (request as any).session = session;
    
    return handler(request);
  };
}

// Usage
export const GET = withAuth(
  async (request: NextRequest) => {
    const session = (request as any).session;
    return NextResponse.json({ user: session.user });
  },
  { roles: ['admin'] }
);
```

## Testing

### Unit Testing RouteGuard

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import { RouteGuard } from '@/components/RouteGuard';
import { AuthProvider } from '@/contexts/AuthContext';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

function TestWrapper({ children, authState }) {
  return (
    <AuthProvider initialState={authState}>
      {children}
    </AuthProvider>
  );
}

test('should render children when authenticated', () => {
  render(
    <TestWrapper authState={{ isAuthenticated: true, loading: false }}>
      <RouteGuard requireAuth={true}>
        <div data-testid="protected-content">Protected Content</div>
      </RouteGuard>
    </TestWrapper>
  );
  
  expect(screen.getByTestId('protected-content')).toBeInTheDocument();
});

test('should show loading when auth is loading', () => {
  render(
    <TestWrapper authState={{ isAuthenticated: false, loading: true }}>
      <RouteGuard requireAuth={true}>
        <div data-testid="protected-content">Protected Content</div>
      </RouteGuard>
    </TestWrapper>
  );
  
  expect(screen.getByRole('status')).toBeInTheDocument();
  expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
});

test('should redirect when not authenticated', async () => {
  const mockPush = jest.fn();
  jest.mocked(useRouter).mockReturnValue({ push: mockPush });
  
  render(
    <TestWrapper authState={{ isAuthenticated: false, loading: false }}>
      <RouteGuard requireAuth={true}>
        <div data-testid="protected-content">Protected Content</div>
      </RouteGuard>
    </TestWrapper>
  );
  
  await waitFor(() => {
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('/login?returnUrl=')
    );
  });
});
```

### Testing Middleware

```typescript
import { NextRequest } from 'next/server';
import { middleware } from '@/middleware';

// Mock environment variables
const originalEnv = process.env;

beforeEach(() => {
  process.env = { ...originalEnv };
});

afterEach(() => {
  process.env = originalEnv;
});

test('should allow access when auth is disabled', () => {
  process.env.AUTH_ENABLED = 'false';
  
  const request = new NextRequest('https://example.com/protected');
  const response = middleware(request);
  
  expect(response.status).toBe(200);
});

test('should redirect to login for protected routes', () => {
  process.env.AUTH_ENABLED = 'true';
  
  const request = new NextRequest('https://example.com/dashboard');
  const response = middleware(request);
  
  expect(response.status).toBe(302);
  expect(response.headers.get('location')).toContain('/login');
});

test('should allow access with valid session', () => {
  process.env.AUTH_ENABLED = 'true';
  
  const request = new NextRequest('https://example.com/dashboard');
  request.cookies.set('auth_token', 'valid-token');
  request.cookies.set('session_data', JSON.stringify({
    token: 'valid-token',
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
    userId: '1'
  }));
  
  const response = middleware(request);
  
  expect(response.status).toBe(200);
});
```

### Property Testing

```tsx
import * as fc from 'fast-check';

describe('Route Protection Properties', () => {
  it('should maintain protection consistency', () => {
    fc.assert(
      fc.property(
        fc.record({
          authEnabled: fc.boolean(),
          isAuthenticated: fc.boolean(),
          requireAuth: fc.boolean(),
          userRoles: fc.array(fc.string()),
          requiredRoles: fc.array(fc.string())
        }),
        (testConfig) => {
          const {
            authEnabled,
            isAuthenticated,
            requireAuth,
            userRoles,
            requiredRoles
          } = testConfig;
          
          const shouldAllowAccess = calculateAccess(
            authEnabled,
            isAuthenticated,
            requireAuth,
            userRoles,
            requiredRoles
          );
          
          const { container } = render(
            <TestAuthProvider 
              authEnabled={authEnabled}
              isAuthenticated={isAuthenticated}
              userRoles={userRoles}
            >
              <RouteGuard 
                requireAuth={requireAuth}
                roles={requiredRoles}
              >
                <div data-testid="content">Content</div>
              </RouteGuard>
            </TestAuthProvider>
          );
          
          const content = container.querySelector('[data-testid="content"]');
          
          if (shouldAllowAccess) {
            expect(content).toBeTruthy();
          } else {
            expect(content).toBeFalsy();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

function calculateAccess(
  authEnabled: boolean,
  isAuthenticated: boolean,
  requireAuth: boolean,
  userRoles: string[],
  requiredRoles: string[]
): boolean {
  // When auth is disabled, always allow access
  if (!authEnabled) return true;
  
  // When auth is not required, allow access
  if (!requireAuth) return true;
  
  // When auth is required but user is not authenticated, deny access
  if (requireAuth && !isAuthenticated) return false;
  
  // When roles are required, check if user has required roles
  if (requiredRoles.length > 0) {
    return requiredRoles.some(role => userRoles.includes(role));
  }
  
  // Default: allow access for authenticated users
  return true;
}
```

## Advanced Patterns

### Higher-Order Component Pattern

```tsx
function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    requireAuth?: boolean;
    roles?: string[];
    fallback?: React.ComponentType;
  } = {}
) {
  const AuthenticatedComponent = (props: P) => {
    return (
      <RouteGuard 
        requireAuth={options.requireAuth}
        roles={options.roles}
        fallback={options.fallback ? <options.fallback /> : undefined}
      >
        <Component {...props} />
      </RouteGuard>
    );
  };
  
  AuthenticatedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;
  
  return AuthenticatedComponent;
}

// Usage
const ProtectedDashboard = withAuth(Dashboard, {
  requireAuth: true,
  roles: ['user', 'admin']
});

const AdminPanel = withAuth(AdminPanelComponent, {
  requireAuth: true,
  roles: ['admin'],
  fallback: AccessDenied
});
```

### Route-Based Protection Hook

```tsx
function useRouteProtection(
  requireAuth: boolean = true,
  roles: string[] = []
) {
  const { isAuthenticated, user, loading } = useAuth();
  const router = useRouter();
  const config = ConfigManager.getAuthConfig();
  
  const isAllowed = useMemo(() => {
    if (!config.authEnabled) return true;
    if (!requireAuth) return true;
    if (loading) return null; // Still checking
    if (!isAuthenticated) return false;
    
    if (roles.length > 0 && user) {
      return roles.some(role => user.roles.includes(role));
    }
    
    return true;
  }, [config.authEnabled, requireAuth, loading, isAuthenticated, user, roles]);
  
  useEffect(() => {
    if (isAllowed === false) {
      const currentPath = window.location.pathname;
      router.push(`/login?returnUrl=${encodeURIComponent(currentPath)}`);
    }
  }, [isAllowed, router]);
  
  return {
    isAllowed,
    isLoading: loading || isAllowed === null,
    canAccess: isAllowed === true
  };
}

// Usage
function ProtectedPage() {
  const { canAccess, isLoading } = useRouteProtection(true, ['admin']);
  
  if (isLoading) return <LoadingSpinner />;
  if (!canAccess) return null; // Will redirect
  
  return <AdminContent />;
}
```

### Dynamic Route Protection

```tsx
interface DynamicRouteConfig {
  [path: string]: {
    requireAuth: boolean;
    roles?: string[];
    condition?: (user: User) => boolean;
  };
}

const routeConfigs: DynamicRouteConfig = {
  '/dashboard': { requireAuth: true },
  '/admin': { requireAuth: true, roles: ['admin'] },
  '/profile': { 
    requireAuth: true,
    condition: (user) => user.emailVerified
  },
  '/premium': {
    requireAuth: true,
    condition: (user) => user.subscription === 'premium'
  }
};

function DynamicRouteGuard({ children }) {
  const pathname = usePathname();
  const { user } = useAuth();
  
  const routeConfig = routeConfigs[pathname];
  
  if (!routeConfig) {
    return <>{children}</>;
  }
  
  const meetsCondition = routeConfig.condition 
    ? routeConfig.condition(user)
    : true;
  
  return (
    <RouteGuard 
      requireAuth={routeConfig.requireAuth}
      roles={routeConfig.roles}
    >
      {meetsCondition ? children : <ConditionNotMet />}
    </RouteGuard>
  );
}
```

## Performance Optimization

### Lazy Loading Protected Routes

```tsx
import { lazy, Suspense } from 'react';

const LazyProtectedComponent = lazy(() => import('./ProtectedComponent'));

function LazyProtectedRoute() {
  return (
    <RouteGuard requireAuth={true}>
      <Suspense fallback={<LoadingSpinner />}>
        <LazyProtectedComponent />
      </Suspense>
    </RouteGuard>
  );
}
```

### Memoized Route Guards

```tsx
const MemoizedRouteGuard = memo(RouteGuard, (prevProps, nextProps) => {
  return (
    prevProps.requireAuth === nextProps.requireAuth &&
    JSON.stringify(prevProps.roles) === JSON.stringify(nextProps.roles) &&
    prevProps.children === nextProps.children
  );
});
```

## Troubleshooting

### Common Issues

#### 1. Infinite redirect loops

**Cause:** Login page is protected or incorrect redirect configuration

**Solution:**
```tsx
// Ensure login page is not protected
const publicRoutes = ['/login', '/register', '/forgot-password'];

// Check middleware configuration
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|login|register).*)',
  ],
};
```

#### 2. Flash of unauthenticated content

**Cause:** Authentication state not loaded before rendering

**Solution:**
```tsx
function RouteGuard({ children, requireAuth }) {
  const { isAuthenticated, loading } = useAuth();
  
  // Always show loading until auth state is determined
  if (loading) {
    return <LoadingSpinner />;
  }
  
  // Rest of component logic
}
```

#### 3. Server-client mismatch in SSR

**Cause:** Different authentication state between server and client

**Solution:**
```tsx
// Use consistent auth checking
function useSSRSafeAuth() {
  const [mounted, setMounted] = useState(false);
  const auth = useAuth();
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return { ...auth, loading: true };
  }
  
  return auth;
}
```

## Requirements Mapping

This module implements the following requirements:

- **3.1** - Conditional rendering based on authentication state
- **3.2** - Route protection and access control
- **3.3** - Automatic redirects for unauthenticated users
- **3.5** - Navigation between authenticated and non-authenticated states
- **8.1** - App router integration and route protection
- **8.2** - Server-side rendering authentication consistency
- **8.3** - Middleware-based server-side protection
- **1.4** - Non-interference when authentication is disabled
- **7.3** - Comprehensive documentation and examples