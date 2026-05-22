import { API_ROUTES } from '../constants/routes';
import type { HelloResponse } from '../types/api';
import { backendMainApi } from './clients/backend-main';

export async function getHello(): Promise<HelloResponse> {
  return backendMainApi.get<HelloResponse>(API_ROUTES.hello);
}
