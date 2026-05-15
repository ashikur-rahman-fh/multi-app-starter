import { describe, expect, it } from 'vitest';
import { ApiError, getUserFacingMessage, mapHttpStatusToMessage, USER_MESSAGES } from './errors';

describe('mapHttpStatusToMessage', () => {
  it('maps common HTTP statuses to safe messages', () => {
    expect(mapHttpStatusToMessage(404)).toBe(USER_MESSAGES.notFound);
    expect(mapHttpStatusToMessage(405)).toBe(USER_MESSAGES.methodNotAllowed);
    expect(mapHttpStatusToMessage(500)).toBe(USER_MESSAGES.serverError);
    expect(mapHttpStatusToMessage(418)).toBe(USER_MESSAGES.unknown);
  });
});

describe('getUserFacingMessage', () => {
  it('returns ApiError userMessage', () => {
    const error = new ApiError({ userMessage: USER_MESSAGES.notFound, status: 404 });
    expect(getUserFacingMessage(error)).toBe(USER_MESSAGES.notFound);
  });

  it('returns generic message for unknown errors', () => {
    expect(getUserFacingMessage(new Error('Request failed with status 500'))).toBe(
      USER_MESSAGES.unknown,
    );
    expect(getUserFacingMessage('oops')).toBe(USER_MESSAGES.unknown);
  });
});
