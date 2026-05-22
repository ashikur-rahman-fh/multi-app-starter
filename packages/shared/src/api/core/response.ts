export type ApiSuccessEnvelope<T> = {
  success: true;
  data: T;
};

export function isApiSuccessEnvelope<T>(body: unknown): body is ApiSuccessEnvelope<T> {
  if (typeof body !== 'object' || body === null) {
    return false;
  }
  const candidate = body as Record<string, unknown>;
  return candidate.success === true && 'data' in candidate;
}

export function unwrapResponseData<T>(body: unknown, unwrapEnvelope: boolean): T {
  if (unwrapEnvelope && isApiSuccessEnvelope<T>(body)) {
    return body.data;
  }
  return body as T;
}
