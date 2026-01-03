'use client';

import React from 'react';
import { LoginPage } from './LoginPage';
import { useLoginPage } from '@/hooks/useLoginPage';

/**
 * LoginPage Container Component
 * Connects LoginPage with authentication logic
 */
export function LoginPageContainer() {
  const { handleLogin, loading, error } = useLoginPage();

  return (
    <LoginPage
      onLogin={handleLogin}
      loading={loading}
      error={error}
    />
  );
}