'use client';

import { adminAuthApi, getUserFacingMessage, isApiError } from '@starter/shared/api';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ErrorAlert,
  Input,
  Navbar,
  PageShell,
} from '@starter/shared/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useId, useState, type FormEvent } from 'react';
import { ADMIN_AUTH_COPY } from '@/auth/messages';
import { useAdminAuth } from '@/auth/AdminAuthProvider';
import { RequireAdminAuth } from '@/auth/guards';

function StatusBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <Badge variant={active ? 'default' : 'outline'}>
      {label}: {active ? ADMIN_AUTH_COPY.yes : ADMIN_AUTH_COPY.no}
    </Badge>
  );
}

export function AdminProfilePage() {
  const router = useRouter();
  const { user, logout, isLoggingOut, refreshUser } = useAdminAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const firstNameId = useId();
  const lastNameId = useId();
  const emailId = useId();
  const errorId = useId();
  const successId = useId();

  function startEditing() {
    if (!user) {
      return;
    }
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setEmail(user.email);
    setError(null);
    setSuccess(null);
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
    setError(null);
  }

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || isSaving) {
      return;
    }
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await adminAuthApi.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
      });
      await refreshUser();
      setIsEditing(false);
      setSuccess(ADMIN_AUTH_COPY.profileSaved);
    } catch (err) {
      if (isApiError(err) && err.isValidationError) {
        setError(ADMIN_AUTH_COPY.profileValidation);
      } else {
        setError(getUserFacingMessage(err));
      }
    } finally {
      setIsSaving(false);
    }
  }

  const canSave = isEditing && email.trim().length > 0 && !isSaving;

  return (
    <RequireAdminAuth>
      <PageShell
        data-testid="admin-profile-page"
        header={
          <Navbar
            appName="Admin"
            items={[{ label: 'Profile', href: '/', active: true }]}
            actions={
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void handleLogout()}
                disabled={isLoggingOut}
                aria-busy={isLoggingOut}
              >
                {isLoggingOut ? ADMIN_AUTH_COPY.loggingOut : ADMIN_AUTH_COPY.logout}
              </Button>
            }
          />
        }
      >
        {user ? (
          <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
            <Card>
              <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle>{ADMIN_AUTH_COPY.profileTitle}</CardTitle>
                  <CardDescription>{ADMIN_AUTH_COPY.profileSubtitle}</CardDescription>
                </div>
                {!isEditing ? (
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={startEditing}>
                      {ADMIN_AUTH_COPY.editProfile}
                    </Button>
                    <Button type="button" variant="outline" size="sm" asChild>
                      <Link href="/change-password">{ADMIN_AUTH_COPY.changePassword}</Link>
                    </Button>
                  </div>
                ) : null}
              </CardHeader>
              <CardContent className="space-y-4">
                {success ? (
                  <p
                    id={successId}
                    className="text-sm text-green-700 dark:text-green-400"
                    role="status"
                    aria-live="polite"
                    data-testid="admin-profile-success"
                  >
                    {success}
                  </p>
                ) : null}

                {isEditing ? (
                  <form
                    className="space-y-4"
                    onSubmit={(event) => void handleSave(event)}
                    noValidate
                  >
                    {error ? (
                      <ErrorAlert
                        id={errorId}
                        title="Could not save profile"
                        description={error}
                        role="alert"
                        aria-live="polite"
                        data-testid="admin-profile-error"
                      />
                    ) : null}
                    <div className="space-y-2">
                      <label htmlFor={firstNameId} className="text-sm font-medium text-foreground">
                        First name
                      </label>
                      <Input
                        id={firstNameId}
                        name="firstName"
                        value={firstName}
                        onChange={(event) => setFirstName(event.target.value)}
                        autoComplete="given-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor={lastNameId} className="text-sm font-medium text-foreground">
                        Last name
                      </label>
                      <Input
                        id={lastNameId}
                        name="lastName"
                        value={lastName}
                        onChange={(event) => setLastName(event.target.value)}
                        autoComplete="family-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor={emailId} className="text-sm font-medium text-foreground">
                        Email
                      </label>
                      <Input
                        id={emailId}
                        name="email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        autoComplete="email"
                        required
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="submit" disabled={!canSave} aria-busy={isSaving}>
                        {isSaving ? ADMIN_AUTH_COPY.savingProfile : ADMIN_AUTH_COPY.saveProfile}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={cancelEditing}
                        disabled={isSaving}
                      >
                        {ADMIN_AUTH_COPY.cancelEdit}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <>
                    <dl className="grid gap-3 text-sm">
                      <div className="grid gap-1">
                        <dt className="font-medium text-muted-foreground">Name</dt>
                        <dd data-testid="admin-profile-name">{user.name}</dd>
                      </div>
                      <div className="grid gap-1">
                        <dt className="font-medium text-muted-foreground">Username</dt>
                        <dd data-testid="admin-profile-username">{user.username}</dd>
                      </div>
                      <div className="grid gap-1">
                        <dt className="font-medium text-muted-foreground">Email</dt>
                        <dd data-testid="admin-profile-email">{user.email}</dd>
                      </div>
                    </dl>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge label={ADMIN_AUTH_COPY.staffStatus} active={user.isStaff} />
                      <StatusBadge
                        label={ADMIN_AUTH_COPY.superuserStatus}
                        active={user.isSuperuser}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}
      </PageShell>
    </RequireAdminAuth>
  );
}
