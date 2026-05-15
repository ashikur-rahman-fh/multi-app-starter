'use client';

import { getHello } from '@starter/shared/api/hello';
import { Button } from '@starter/shared/components/Button';
import { ErrorState } from '@starter/shared/components/ErrorState';
import { LoadingState } from '@starter/shared/components/LoadingState';
import { useApi } from '@starter/shared/hooks/useApi';

export function HomePage() {
  const { state, reload } = useApi(() => getHello());
  const isLoading = state.status === 'loading';

  return (
    <main>
      <h1>Main App Hello World</h1>
      <p>This page calls the Django backend using the shared workspace package.</p>

      <div style={{ marginTop: '1rem' }}>
        <Button
          type="button"
          onClick={() => void reload()}
          disabled={isLoading}
          aria-busy={isLoading}
        >
          {isLoading ? 'Loading hello...' : 'Reload hello'}
        </Button>
      </div>

      <div style={{ marginTop: '1rem' }}>
        {state.status === 'loading' || state.status === 'idle' ? <LoadingState /> : null}
        {state.status === 'error' ? <ErrorState message={state.error} /> : null}
        {state.status === 'success' ? (
          <p data-testid="hello-message">{state.data.message}</p>
        ) : null}
      </div>
    </main>
  );
}
