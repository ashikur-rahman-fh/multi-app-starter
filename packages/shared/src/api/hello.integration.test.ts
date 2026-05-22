import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { getHello } from './hello';

const server = setupServer(
  http.get('*/api/hello/', () => HttpResponse.json({ message: 'Hello from mocked backend' })),
);

describe('getHello (MSW)', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('returns mocked backend response', async () => {
    vi.stubEnv('NEXT_PUBLIC_BACKEND_MAIN_API_URL', 'http://localhost:8000');
    const body = await getHello();
    expect(body).toEqual({ message: 'Hello from mocked backend' });
  });
});
