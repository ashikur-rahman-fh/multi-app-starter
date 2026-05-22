'use client';

import {
  adminAuthApi,
  ensureAdminCsrf,
  isApiError,
  setAdminCsrfToken,
  type AdminUser,
} from '@starter/shared/api';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ADMIN_AUTH_COPY } from './messages';

export type AdminAuthState = {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoggingIn: boolean;
  isLoggingOut: boolean;
  error: string | null;
};

export type AdminAuthContextValue = AdminAuthState & {
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

function mapAuthError(error: unknown): string {
  if (isApiError(error)) {
    if (error.isForbidden) {
      return ADMIN_AUTH_COPY.unauthorized;
    }
    if (error.code === 'INVALID_CREDENTIALS') {
      return ADMIN_AUTH_COPY.invalidLogin;
    }
    if (error.isUnauthorized) {
      return ADMIN_AUTH_COPY.invalidLogin;
    }
  }
  return ADMIN_AUTH_COPY.invalidLogin;
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearAuthState = useCallback(() => {
    setUser(null);
    setAdminCsrfToken(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await adminAuthApi.getCurrentUser();
      setUser(currentUser);
      setError(null);
    } catch (err) {
      clearAuthState();
      if (isApiError(err) && err.isForbidden) {
        setError(ADMIN_AUTH_COPY.unauthorized);
      }
      throw err;
    }
  }, [clearAuthState]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        await ensureAdminCsrf();
        if (cancelled) {
          return;
        }
        await refreshUser();
      } catch {
        if (!cancelled) {
          clearAuthState();
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [clearAuthState, refreshUser]);

  const login = useCallback(
    async (usernameOrEmail: string, password: string) => {
      setIsLoggingIn(true);
      setError(null);
      try {
        await ensureAdminCsrf();
        const loggedInUser = await adminAuthApi.login({ usernameOrEmail, password });
        setUser(loggedInUser);
      } catch (err) {
        clearAuthState();
        setError(mapAuthError(err));
        throw err;
      } finally {
        setIsLoggingIn(false);
      }
    },
    [clearAuthState],
  );

  const logout = useCallback(async () => {
    setIsLoggingOut(true);
    setError(null);
    try {
      await adminAuthApi.logout();
    } catch {
      // Clear local state even if the network call fails.
    } finally {
      clearAuthState();
      setIsLoggingOut(false);
    }
  }, [clearAuthState]);

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      isLoggingIn,
      isLoggingOut,
      error,
      login,
      logout,
      refreshUser,
      clearError: () => setError(null),
    }),
    [user, isLoading, isLoggingIn, isLoggingOut, error, login, logout, refreshUser],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth(): AdminAuthContextValue {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
}
