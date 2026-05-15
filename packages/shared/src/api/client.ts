import { ApiError, isApiErrorBody, mapHttpStatusToMessage, USER_MESSAGES } from './errors';

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
}

async function parseErrorResponse(response: Response): Promise<{
  userMessage: string;
  code?: string;
}> {
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return { userMessage: mapHttpStatusToMessage(response.status) };
  }

  try {
    const body: unknown = await response.json();
    if (isApiErrorBody(body)) {
      return {
        userMessage: body.error.message,
        code: body.error.code,
      };
    }
  } catch {
    // Fall through to status-based mapping.
  }

  return { userMessage: mapHttpStatusToMessage(response.status) };
}

function logApiError(detail: Record<string, unknown>): void {
  if (process.env.NODE_ENV !== 'production') {
    console.error('[api]', detail);
  }
}

export async function getJson<T>(path: string): Promise<T> {
  const base = getApiBaseUrl().replace(/\/$/, '');
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const url = `${base}${normalized}`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch (error) {
    logApiError({ url, kind: 'network', error });
    throw new ApiError({
      userMessage: USER_MESSAGES.network,
      cause: error,
    });
  }

  if (!response.ok) {
    const { userMessage, code } = await parseErrorResponse(response);
    logApiError({
      url,
      status: response.status,
      code,
      userMessage,
    });
    throw new ApiError({
      userMessage,
      status: response.status,
      code,
    });
  }

  return (await response.json()) as T;
}
