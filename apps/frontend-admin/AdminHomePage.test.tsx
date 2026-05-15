import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { USER_MESSAGES } from '@starter/shared/api/errors';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { AdminHomePage } from './src/app/AdminHomePage';
import { server } from './vitest.setup';

describe('AdminHomePage', () => {
  it('renders title', () => {
    render(<AdminHomePage />);
    expect(screen.getByRole('heading', { name: /admin app hello world/i })).toBeInTheDocument();
  });

  it('shows backend hello response', async () => {
    render(<AdminHomePage />);
    expect(await screen.findByTestId('hello-message')).toHaveTextContent(
      'Hello from Django backend',
    );
  });

  it('shared Button triggers reload', async () => {
    const user = userEvent.setup();
    render(<AdminHomePage />);
    await screen.findByTestId('hello-message');

    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await user.click(screen.getByRole('button', { name: /reload hello/i }));
    expect(fetchSpy).toHaveBeenCalled();
  });

  it('shows a safe error message when the API fails', async () => {
    server.use(
      http.get('*/api/hello/', () =>
        HttpResponse.json(
          {
            success: false,
            error: {
              code: 'INTERNAL_SERVER_ERROR',
              message: USER_MESSAGES.serverError,
              details: {},
            },
          },
          { status: 500 },
        ),
      ),
    );

    render(<AdminHomePage />);

    expect(await screen.findByRole('alert')).toHaveTextContent(USER_MESSAGES.serverError);
  });

  it('disables reload while loading', async () => {
    let resolveResponse!: () => void;
    const pending = new Promise<void>((resolve) => {
      resolveResponse = resolve;
    });
    server.use(
      http.get('*/api/hello/', async () => {
        await pending;
        return HttpResponse.json({ message: 'Hello from Django backend' });
      }),
    );

    render(<AdminHomePage />);

    const button = await screen.findByRole('button', { name: /loading hello/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');

    resolveResponse();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /reload hello/i })).toBeEnabled();
    });
  });
});
