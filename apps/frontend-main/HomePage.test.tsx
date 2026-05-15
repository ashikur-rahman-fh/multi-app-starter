import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { USER_MESSAGES } from '@starter/shared/api/errors';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { HomePage } from './src/app/HomePage';
import { server } from './vitest.setup';

describe('HomePage', () => {
  it('renders title', () => {
    render(<HomePage />);
    expect(screen.getByRole('heading', { name: /main app hello world/i })).toBeInTheDocument();
  });

  it('shows backend hello response', async () => {
    render(<HomePage />);
    expect(await screen.findByTestId('hello-message')).toHaveTextContent(
      'Hello from Django backend',
    );
  });

  it('shared Button triggers reload', async () => {
    const user = userEvent.setup();
    render(<HomePage />);
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

    render(<HomePage />);

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

    render(<HomePage />);

    const button = await screen.findByRole('button', { name: /loading hello/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');

    resolveResponse();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /reload hello/i })).toBeEnabled();
    });
  });
});
