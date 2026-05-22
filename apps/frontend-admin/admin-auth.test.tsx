import { render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminProfilePage } from './src/app/AdminProfilePage';
import { LoginPage } from './src/app/login/LoginPage';
import { AdminAuthProvider } from './src/auth/AdminAuthProvider';
import { ADMIN_AUTH_COPY } from './src/auth/messages';
import { adminUser, server } from './vitest.setup';

const replaceMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: replaceMock,
    push: vi.fn(),
  }),
}));

function renderWithAuth(ui: ReactElement) {
  return render(<AdminAuthProvider>{ui}</AdminAuthProvider>);
}

describe('LoginPage', () => {
  beforeEach(() => {
    replaceMock.mockClear();
  });

  it('renders login page with accessible fields', async () => {
    renderWithAuth(<LoginPage />);
    expect(await screen.findByTestId('admin-login-page')).toBeInTheDocument();
    expect(screen.getByLabelText(ADMIN_AUTH_COPY.usernameOrEmailLabel)).toBeInTheDocument();
    expect(screen.getByLabelText(ADMIN_AUTH_COPY.passwordLabel)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: ADMIN_AUTH_COPY.signIn })).toBeInTheDocument();
  });

  it('disables submit when required fields are empty', async () => {
    renderWithAuth(<LoginPage />);
    await screen.findByTestId('admin-login-page');
    expect(screen.getByRole('button', { name: ADMIN_AUTH_COPY.signIn })).toBeDisabled();
  });

  it('disables submit while loading', async () => {
    let resolveLogin!: () => void;
    const pending = new Promise<void>((resolve) => {
      resolveLogin = resolve;
    });
    server.use(
      http.post('*/api/admin/auth/login/', async () => {
        await pending;
        return HttpResponse.json(adminUser);
      }),
    );

    const user = userEvent.setup();
    renderWithAuth(<LoginPage />);
    await screen.findByTestId('admin-login-page');

    await user.type(screen.getByLabelText(ADMIN_AUTH_COPY.usernameOrEmailLabel), 'admin');
    await user.type(screen.getByLabelText(ADMIN_AUTH_COPY.passwordLabel), 'correct');
    await user.click(screen.getByRole('button', { name: ADMIN_AUTH_COPY.signIn }));

    expect(screen.getByRole('button', { name: ADMIN_AUTH_COPY.signingIn })).toBeDisabled();
    resolveLogin();
    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/');
    });
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    renderWithAuth(<LoginPage />);
    await screen.findByTestId('admin-login-page');

    const password = screen.getByLabelText(ADMIN_AUTH_COPY.passwordLabel);
    expect(password).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: ADMIN_AUTH_COPY.showPassword }));
    expect(password).toHaveAttribute('type', 'text');
    await user.click(screen.getByRole('button', { name: ADMIN_AUTH_COPY.hidePassword }));
    expect(password).toHaveAttribute('type', 'password');
  });

  it('shows friendly error on failed login without raw API text', async () => {
    const user = userEvent.setup();
    renderWithAuth(<LoginPage />);
    await screen.findByTestId('admin-login-page');

    await user.type(screen.getByLabelText(ADMIN_AUTH_COPY.usernameOrEmailLabel), 'admin');
    await user.type(screen.getByLabelText(ADMIN_AUTH_COPY.passwordLabel), 'wrong');
    await user.click(screen.getByRole('button', { name: ADMIN_AUTH_COPY.signIn }));

    expect(await screen.findByText(ADMIN_AUTH_COPY.invalidLogin)).toBeInTheDocument();
    expect(screen.queryByText(/INVALID_CREDENTIALS/i)).not.toBeInTheDocument();
  });

  it('redirects to profile after successful login', async () => {
    const user = userEvent.setup();
    renderWithAuth(<LoginPage />);
    await screen.findByTestId('admin-login-page');

    await user.type(screen.getByLabelText(ADMIN_AUTH_COPY.usernameOrEmailLabel), 'admin');
    await user.type(screen.getByLabelText(ADMIN_AUTH_COPY.passwordLabel), 'correct');
    await user.click(screen.getByRole('button', { name: ADMIN_AUTH_COPY.signIn }));

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/');
    });
  });
});

describe('Admin profile and route guards', () => {
  beforeEach(() => {
    replaceMock.mockClear();
  });

  it('redirects unauthenticated users away from profile', async () => {
    renderWithAuth(<AdminProfilePage />);
    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/login');
    });
    expect(screen.queryByTestId('admin-profile-name')).not.toBeInTheDocument();
  });

  it('shows loading state while checking auth', () => {
    renderWithAuth(<AdminProfilePage />);
    expect(screen.getByTestId('admin-auth-loading')).toBeInTheDocument();
  });

  it('renders profile for authenticated user', async () => {
    server.use(http.get('*/api/admin/auth/me/', () => HttpResponse.json(adminUser)));

    renderWithAuth(<AdminProfilePage />);

    expect(await screen.findByTestId('admin-profile-name')).toHaveTextContent(adminUser.name);
    expect(screen.getByTestId('admin-profile-username')).toHaveTextContent(adminUser.username);
    expect(screen.getByTestId('admin-profile-email')).toHaveTextContent(adminUser.email);
    expect(
      screen.getByText(`${ADMIN_AUTH_COPY.staffStatus}: ${ADMIN_AUTH_COPY.yes}`),
    ).toBeInTheDocument();
    expect(
      screen.getByText(`${ADMIN_AUTH_COPY.superuserStatus}: ${ADMIN_AUTH_COPY.yes}`),
    ).toBeInTheDocument();
  });

  it('redirects authenticated users away from login page', async () => {
    server.use(http.get('*/api/admin/auth/me/', () => HttpResponse.json(adminUser)));

    renderWithAuth(<LoginPage />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/');
    });
  });

  it('logout clears session and redirects to login', async () => {
    server.use(http.get('*/api/admin/auth/me/', () => HttpResponse.json(adminUser)));

    const user = userEvent.setup();
    renderWithAuth(<AdminProfilePage />);
    await screen.findByTestId('admin-profile-name');

    await user.click(screen.getByRole('button', { name: ADMIN_AUTH_COPY.logout }));

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/login');
    });
  });

  it('shows permission message when me returns forbidden', async () => {
    server.use(
      http.get('*/api/admin/auth/me/', () =>
        HttpResponse.json(
          {
            success: false,
            error: {
              code: 'ADMIN_FORBIDDEN',
              message: ADMIN_AUTH_COPY.unauthorized,
              details: {},
            },
          },
          { status: 403 },
        ),
      ),
    );

    renderWithAuth(<AdminProfilePage />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/login');
    });
  });
});
