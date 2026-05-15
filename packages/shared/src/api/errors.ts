export const USER_MESSAGES = {
  network: 'We could not connect to the server. Please check your connection and try again.',
  notFound: 'We could not find the requested resource.',
  methodNotAllowed: 'This action is not supported.',
  serverError: 'The server had a problem. Please try again later.',
  unknown: 'Something went wrong. Please try again.',
} as const;

export type ApiErrorBody = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
};

export class ApiError extends Error {
  readonly userMessage: string;
  readonly status?: number;
  readonly code?: string;

  constructor(options: { userMessage: string; status?: number; code?: string; cause?: unknown }) {
    super(options.userMessage);
    this.name = 'ApiError';
    this.userMessage = options.userMessage;
    this.status = options.status;
    this.code = options.code;
    if (options.cause !== undefined) {
      this.cause = options.cause;
    }
  }
}

export function mapHttpStatusToMessage(status: number): string {
  if (status === 404) {
    return USER_MESSAGES.notFound;
  }
  if (status === 405) {
    return USER_MESSAGES.methodNotAllowed;
  }
  if (status >= 500) {
    return USER_MESSAGES.serverError;
  }
  return USER_MESSAGES.unknown;
}

export function isApiErrorBody(body: unknown): body is ApiErrorBody {
  if (typeof body !== 'object' || body === null) {
    return false;
  }
  const candidate = body as Record<string, unknown>;
  if (candidate.success !== false) {
    return false;
  }
  const error = candidate.error;
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  const errorRecord = error as Record<string, unknown>;
  return typeof errorRecord.message === 'string' && typeof errorRecord.code === 'string';
}

export function getUserFacingMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.userMessage;
  }
  return USER_MESSAGES.unknown;
}
