'use client';

import {
  ErrorAlert,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  PageShell,
} from '@starter/shared/ui';
import { useRouter } from 'next/navigation';
import { useId, useState, type FormEvent } from 'react';
import { ADMIN_AUTH_COPY } from '@/auth/messages';
import { useAdminAuth } from '@/auth/AdminAuthProvider';
import { RedirectIfAuthenticated } from '@/auth/guards';

export function LoginPage() {
  const router = useRouter();
  const { login, isLoggingIn, error, clearError } = useAdminAuth();
  const usernameId = useId();
  const passwordId = useId();
  const errorId = useId();

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const trimmedUsername = usernameOrEmail.trim();
  const canSubmit = trimmedUsername.length > 0 && password.length > 0 && !isLoggingIn;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }
    clearError();
    try {
      await login(trimmedUsername, password);
      router.replace('/');
    } catch {
      // Error state is set in the auth provider.
    }
  }

  return (
    <RedirectIfAuthenticated>
      <PageShell
        data-testid="admin-login-page"
        contentClassName="flex flex-1 items-center justify-center px-4 py-12"
      >
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl">{ADMIN_AUTH_COPY.loginTitle}</CardTitle>
            <CardDescription>{ADMIN_AUTH_COPY.loginSubtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={(event) => void handleSubmit(event)} noValidate>
              {error ? (
                <ErrorAlert
                  id={errorId}
                  title="Sign in failed"
                  description={error}
                  role="alert"
                  aria-live="polite"
                />
              ) : null}

              <div className="space-y-2">
                <label htmlFor={usernameId} className="text-sm font-medium text-foreground">
                  {ADMIN_AUTH_COPY.usernameOrEmailLabel}
                </label>
                <Input
                  id={usernameId}
                  name="usernameOrEmail"
                  type="text"
                  autoComplete="username"
                  value={usernameOrEmail}
                  onChange={(event) => setUsernameOrEmail(event.target.value)}
                  disabled={isLoggingIn}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor={passwordId} className="text-sm font-medium text-foreground">
                  {ADMIN_AUTH_COPY.passwordLabel}
                </label>
                <div className="relative">
                  <Input
                    id={passwordId}
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={isLoggingIn}
                    required
                    className="pr-24"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={
                      showPassword ? ADMIN_AUTH_COPY.hidePassword : ADMIN_AUTH_COPY.showPassword
                    }
                    aria-pressed={showPassword}
                    disabled={isLoggingIn}
                  >
                    {showPassword ? ADMIN_AUTH_COPY.hidePassword : ADMIN_AUTH_COPY.showPassword}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={!canSubmit}
                aria-busy={isLoggingIn}
              >
                {isLoggingIn ? ADMIN_AUTH_COPY.signingIn : ADMIN_AUTH_COPY.signIn}
              </Button>
            </form>
          </CardContent>
        </Card>
      </PageShell>
    </RedirectIfAuthenticated>
  );
}
