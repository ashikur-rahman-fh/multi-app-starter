'use client';

import { LoadingState } from '@starter/shared/ui';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAdminAuth } from './AdminAuthProvider';

function AuthLoadingShell({ label = 'Loading…' }: { label?: string }) {
  return (
    <div
      className="flex min-h-[50vh] items-center justify-center"
      data-testid="admin-auth-loading"
      aria-busy="true"
    >
      <LoadingState label={label} />
    </div>
  );
}

export function RequireAdminAuth({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAdminAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <AuthLoadingShell label="Checking your session…" />;
  }

  if (!isAuthenticated) {
    return <AuthLoadingShell label="Redirecting to sign in…" />;
  }

  return <>{children}</>;
}

export function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAdminAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <AuthLoadingShell label="Checking your session…" />;
  }

  if (isAuthenticated) {
    return <AuthLoadingShell label="Redirecting…" />;
  }

  return <>{children}</>;
}
