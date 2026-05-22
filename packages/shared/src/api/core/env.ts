const ENV_KEY = 'NEXT_PUBLIC_BACKEND_MAIN_API_URL';
const DEV_FALLBACK = 'http://localhost:8080';

export function getBackendMainApiUrl(): string {
  const configured = process.env[ENV_KEY]?.trim();
  if (configured) {
    return configured;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      `${ENV_KEY} was not set at build time. Rebuild the frontend with your public https API URL (e.g. https://api.example.com).`,
    );
  }
  return DEV_FALLBACK;
}

export const env = {
  get backendMainApiUrl(): string {
    return getBackendMainApiUrl();
  },
};
