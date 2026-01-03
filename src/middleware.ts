import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * NextJS Middleware for server-side route protection
 * Handles authentication checks before pages are rendered
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get authentication configuration from environment
  const authEnabled = process.env.AUTH_ENABLED?.toLowerCase() !== 'false';
  
  // If authentication is disabled, allow all requests
  if (!authEnabled) {
    return NextResponse.next();
  }

  // Define public routes that don't require authentication
  const publicRoutes = [
    '/login',
    '/api/auth',
    '/_next',
    '/favicon.ico',
    '/static',
  ];

  // Check if current path is a public route
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Get session data from cookies or headers
  const sessionToken = request.cookies.get('auth_token')?.value;
  const sessionData = request.cookies.get('session_data')?.value;
  
  // If no session data, redirect to login
  if (!sessionToken || !sessionData) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Validate session data
  try {
    const session = JSON.parse(sessionData);
    const expiresAt = new Date(session.expiresAt);
    
    // Check if session is expired
    if (expiresAt <= new Date()) {
      // Session expired, redirect to login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('returnUrl', pathname);
      
      // Clear expired session cookies
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('auth_token');
      response.cookies.delete('session_data');
      response.cookies.delete('user_data');
      
      return response;
    }
    
    // Session is valid, continue
    return NextResponse.next();
    
  } catch (error) {
    // Invalid session data, redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnUrl', pathname);
    
    // Clear invalid session cookies
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('auth_token');
    response.cookies.delete('session_data');
    response.cookies.delete('user_data');
    
    return response;
  }
}

/**
 * Middleware configuration
 * Define which paths should be processed by this middleware
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};