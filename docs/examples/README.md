# Examples

This directory contains practical examples and usage patterns for the Configurable Authentication Framework.

## Basic Examples

### [Basic Setup](./basic-setup.md)
Complete setup example with authentication enabled/disabled configurations.

### [Login Flow](./login-flow.md)
Implementation of login forms and authentication flow handling.

### [Route Protection](./route-protection.md)
Examples of protecting routes with different authentication requirements.

### [Sidebar Navigation](./sidebar-navigation.md)
Customizing sidebar navigation and handling responsive behavior.

## Advanced Examples

### [Custom Authentication Provider](./custom-provider.md)
Creating and integrating custom authentication providers.

### [External System Integration](./external-integration.md)
Integrating with external authentication systems without interference.

### [SSR Authentication](./ssr-authentication.md)
Handling authentication in server-side rendering scenarios.

### [Session Management](./session-management.md)
Advanced session handling, expiration, and refresh patterns.

## Integration Examples

### [Next.js App Router](./nextjs-app-router.md)
Complete integration with Next.js 13+ App Router.

### [API Routes](./api-routes.md)
Protecting API routes and handling authentication in API endpoints.

### [Middleware Configuration](./middleware-config.md)
Advanced middleware configuration for different deployment scenarios.

### [Environment Configurations](./environment-configs.md)
Different environment setups for development, staging, and production.

## Testing Examples

### [Unit Testing](./unit-testing.md)
Unit testing components and hooks with authentication context.

### [Integration Testing](./integration-testing.md)
End-to-end testing of authentication flows.

### [Property Testing](./property-testing.md)
Property-based testing examples using fast-check.

## Deployment Examples

### [Vercel Deployment](./vercel-deployment.md)
Deploying with Vercel and environment variable configuration.

### [Docker Deployment](./docker-deployment.md)
Containerized deployment with Docker and environment management.

### [AWS Deployment](./aws-deployment.md)
Deployment on AWS with proper security configurations.

## Common Patterns

### [Error Handling](./error-handling.md)
Comprehensive error handling patterns and user feedback.

### [Loading States](./loading-states.md)
Managing loading states during authentication operations.

### [Responsive Design](./responsive-design.md)
Implementing responsive authentication UI and navigation.

### [Accessibility](./accessibility.md)
Ensuring authentication components are accessible.

## Migration Examples

### [From Auth0](./migration-auth0.md)
Migrating from Auth0 to the configurable framework.

### [From NextAuth.js](./migration-nextauth.md)
Migrating from NextAuth.js with minimal disruption.

### [From Custom Auth](./migration-custom.md)
Migrating from existing custom authentication solutions.

## Code Snippets

Quick reference code snippets for common tasks:

```tsx
// Enable/disable authentication
process.env.AUTH_ENABLED = 'true'; // or 'false'

// Basic login
const { login } = useAuth();
await login({ username, password });

// Route protection
<RouteGuard requireAuth={true}>
  <ProtectedContent />
</RouteGuard>

// Custom provider
class MyProvider implements IAuthProvider {
  async authenticate(credentials) {
    // Custom authentication logic
  }
}

// External integration
const { syncWithExternal } = useExternalAuth();
await syncWithExternal(isAuthenticated, user);
```

## Interactive Examples

Live examples and demos are available in the [`/examples`](../../examples/) directory of the repository.