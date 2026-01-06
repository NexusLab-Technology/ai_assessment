'use client';

import React from 'react';
import { AuthProvider } from '@/contexts/AuthContext';

interface AuthWrapperProps {
  children: React.ReactNode;
}

/**
 * Authentication Wrapper Component
 * Always provides authentication context, but behavior varies based on configuration
 */
export function AuthWrapper({ children }: AuthWrapperProps) {
  // Always provide AuthProvider to avoid conditional hook issues
  // The AuthProvider itself will handle disabled auth internally
  return <AuthProvider>{children}</AuthProvider>;
}