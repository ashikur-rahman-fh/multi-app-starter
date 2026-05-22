import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

export const adminUser = {
  id: 1,
  name: 'Admin User',
  firstName: 'Admin',
  lastName: 'User',
  username: 'admin',
  email: 'admin@example.com',
  isStaff: true,
  isSuperuser: true,
};

export const server = setupServer(
  http.get('*/api/hello/', () => HttpResponse.json({ message: 'Hello from Django backend' })),
  http.get('*/api/admin/auth/csrf/', () => HttpResponse.json({ csrfToken: 'test-csrf-token' })),
  http.get('*/api/admin/auth/me/', () =>
    HttpResponse.json(
      {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'You need to sign in to continue.', details: {} },
      },
      { status: 401 },
    ),
  ),
  http.post('*/api/admin/auth/login/', async ({ request }) => {
    const body = (await request.json()) as { usernameOrEmail?: string; password?: string };
    if (body.usernameOrEmail === 'admin' && body.password === 'correct') {
      return HttpResponse.json(adminUser);
    }
    return HttpResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid login details. Please check your credentials and try again.',
        },
      },
      { status: 401 },
    );
  }),
  http.post('*/api/admin/auth/logout/', () => HttpResponse.json({ success: true })),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
