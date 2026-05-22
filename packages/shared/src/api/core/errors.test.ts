import { AxiosError } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ApiError,
  getUserFacingMessage,
  isApiError,
  isApiErrorBody,
  mapHttpStatusToMessage,
  normalizeAxiosError,
  USER_MESSAGES,
} from './errors';

describe('mapHttpStatusToMessage', () => {
  it('maps common HTTP statuses to safe messages', () => {
    expect(mapHttpStatusToMessage(400)).toBe(USER_MESSAGES.badRequest);
    expect(mapHttpStatusToMessage(401)).toBe(USER_MESSAGES.unauthorized);
    expect(mapHttpStatusToMessage(403)).toBe(USER_MESSAGES.forbidden);
    expect(mapHttpStatusToMessage(404)).toBe(USER_MESSAGES.notFound);
    expect(mapHttpStatusToMessage(422)).toBe(USER_MESSAGES.validation);
    expect(mapHttpStatusToMessage(429)).toBe(USER_MESSAGES.rateLimited);
    expect(mapHttpStatusToMessage(500)).toBe(USER_MESSAGES.serverError);
    expect(mapHttpStatusToMessage(418)).toBe(USER_MESSAGES.unknown);
  });
});

describe('isApiErrorBody', () => {
  it('detects backend error envelopes', () => {
    expect(
      isApiErrorBody({
        success: false,
        error: { code: 'X', message: 'msg' },
      }),
    ).toBe(true);
    expect(isApiErrorBody({ success: true })).toBe(false);
  });
});

describe('getUserFacingMessage', () => {
  it('returns ApiError message', () => {
    const error = new ApiError({ message: USER_MESSAGES.notFound, status: 404 });
    expect(getUserFacingMessage(error)).toBe(USER_MESSAGES.notFound);
  });

  it('returns generic message for unknown errors', () => {
    expect(getUserFacingMessage(new Error('Request failed with status 500'))).toBe(
      USER_MESSAGES.unknown,
    );
    expect(getUserFacingMessage('oops')).toBe(USER_MESSAGES.unknown);
  });
});

describe('isApiError', () => {
  it('identifies ApiError instances', () => {
    expect(isApiError(new ApiError({ message: 'x' }))).toBe(true);
    expect(isApiError(new Error('x'))).toBe(false);
  });
});

describe('normalizeAxiosError debug metadata', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('includes redacted debug info in development', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const error = new AxiosError(
      'Request failed',
      'ERR_BAD_REQUEST',
      {
        url: '/api/hello/',
        method: 'get',
        headers: { Authorization: 'Bearer secret' } as never,
      },
      {},
      {
        status: 500,
        statusText: 'Error',
        headers: {},
        config: {} as never,
        data: {},
      },
    );

    const apiError = normalizeAxiosError(error, 'backend-main');
    expect(apiError.debug?.headers?.Authorization).toBe('[redacted]');
  });
});
