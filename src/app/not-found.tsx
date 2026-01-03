'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ConfigManager } from '@/lib/config';

/**
 * Custom 404 Not Found Page
 * Handles redirects based on authentication state:
 * 
 * When AUTH_ENABLED=true:
 * - If user has session → redirect to home (/)
 * - If user has no session → redirect to login (/login)
 * 
 * When AUTH_ENABLED=false:
 * - Always redirect to home (/)
 */
export default function NotFound() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    // Wait for auth loading to complete
    if (loading) return;

    try {
      const isAuthEnabled = ConfigManager.isAuthEnabled();

      if (isAuthEnabled) {
        // Authentication is enabled - redirect based on auth state
        if (isAuthenticated) {
          // User is authenticated → redirect to home
          router.replace('/');
        } else {
          // User is not authenticated → redirect to login
          router.replace('/login');
        }
      } else {
        // Authentication is disabled → always redirect to home
        router.replace('/');
      }
    } catch (error) {
      console.error('Error in 404 redirect logic:', error);
      // Fallback: redirect to home on any error
      router.replace('/');
    }
  }, [isAuthenticated, loading, router]);

  // Show loading state while determining redirect
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">กำลังเปลี่ยนเส้นทาง...</p>
      </div>
    </div>
  );
}