import { API_ROUTES } from '../constants/routes';
import type { HelloResponse } from '../types/api';
import { getJson } from './client';

export async function getHello(): Promise<HelloResponse> {
  return getJson<HelloResponse>(API_ROUTES.hello);
}
