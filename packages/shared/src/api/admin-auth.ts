import { API_ROUTES } from '../constants/routes';
import type {
  AdminChangePasswordRequest,
  AdminChangePasswordResponse,
  AdminCsrfResponse,
  AdminLoginRequest,
  AdminLogoutResponse,
  AdminProfileUpdateRequest,
  AdminUser,
} from '../types/admin-auth';
import { backendAdminApi, getAdminCsrfToken, setAdminCsrfToken } from './clients/backend-admin';

export async function ensureAdminCsrf(): Promise<string> {
  const response = await backendAdminApi.get<AdminCsrfResponse>(API_ROUTES.adminAuth.csrf);
  setAdminCsrfToken(response.csrfToken);
  return response.csrfToken;
}

export const adminAuthApi = {
  async login(credentials: AdminLoginRequest): Promise<AdminUser> {
    if (!getAdminCsrfToken()) {
      await ensureAdminCsrf();
    }
    return backendAdminApi.post<AdminUser, AdminLoginRequest>(
      API_ROUTES.adminAuth.login,
      credentials,
    );
  },

  async getCurrentUser(): Promise<AdminUser> {
    return backendAdminApi.get<AdminUser>(API_ROUTES.adminAuth.me);
  },

  async logout(): Promise<AdminLogoutResponse> {
    if (!getAdminCsrfToken()) {
      await ensureAdminCsrf();
    }
    return backendAdminApi.post<AdminLogoutResponse>(API_ROUTES.adminAuth.logout);
  },

  async updateProfile(data: AdminProfileUpdateRequest): Promise<AdminUser> {
    if (!getAdminCsrfToken()) {
      await ensureAdminCsrf();
    }
    return backendAdminApi.patch<AdminUser, AdminProfileUpdateRequest>(
      API_ROUTES.adminAuth.me,
      data,
    );
  },

  async changePassword(data: AdminChangePasswordRequest): Promise<AdminChangePasswordResponse> {
    if (!getAdminCsrfToken()) {
      await ensureAdminCsrf();
    }
    return backendAdminApi.post<AdminChangePasswordResponse, AdminChangePasswordRequest>(
      API_ROUTES.adminAuth.changePassword,
      data,
    );
  },
};
