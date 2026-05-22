'use client';

import { getHello } from '@starter/shared/api/hello';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ErrorState,
  InfoAlert,
  LoadingState,
  Navbar,
  PageShell,
} from '@starter/shared/ui';
import { useApi } from '@starter/shared/hooks/useApi';

export function AdminHomePage() {
  const { state, reload } = useApi(() => getHello());
  const isLoading = state.status === 'loading';

  return (
    <PageShell
      data-testid="admin-home-page"
      header={
        <Navbar
          appName="Admin App"
          items={[
            { label: 'Home', href: '/', active: true },
            { label: 'Settings', href: '/settings' },
          ]}
          actions={
            <Badge variant="outline" className="font-mono text-xs">
              env: dev
            </Badge>
          }
        />
      }
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Admin shell</CardTitle>
            <CardDescription>
              Calm Neutral Starter — same muted theme as the main app.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoAlert
              title="Admin shell"
              description="Reusable components from @starter/shared/ui."
            />
            <Alert variant="error" title="Access" description="Demo error alert variant." />
            <Button variant="outline" size="md">
              Admin action
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API status</CardTitle>
            <CardDescription className="font-mono text-xs">GET /api/hello/</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              type="button"
              onClick={() => void reload()}
              disabled={isLoading}
              aria-busy={isLoading}
            >
              {isLoading ? 'Loading hello...' : 'Reload hello'}
            </Button>

            {state.status === 'loading' || state.status === 'idle' ? <LoadingState /> : null}
            {state.status === 'error' ? <ErrorState message={state.error} /> : null}
            {state.status === 'success' ? (
              <p data-testid="hello-message" className="text-sm text-foreground">
                {state.data.message}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
