'use client';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Navbar,
  PageShell,
} from '@starter/shared/ui';
import { useRouter } from 'next/navigation';
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
  const { user, logout, isLoggingOut } = useAdminAuth();

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

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
          <Card className="max-w-xl">
            <CardHeader>
              <CardTitle>{ADMIN_AUTH_COPY.profileTitle}</CardTitle>
              <CardDescription>{ADMIN_AUTH_COPY.profileSubtitle}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                <StatusBadge label={ADMIN_AUTH_COPY.superuserStatus} active={user.isSuperuser} />
              </div>
            </CardContent>
          </Card>
        ) : null}
      </PageShell>
    </RequireAdminAuth>
  );
}
