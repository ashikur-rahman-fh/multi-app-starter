export type AdminUser = {
  id: number;
  name: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  isStaff: boolean;
  isSuperuser: boolean;
};

export type AdminLoginRequest = {
  usernameOrEmail: string;
  password: string;
};

export type AdminProfileUpdateRequest = {
  firstName?: string;
  lastName?: string;
  email?: string;
};

export type AdminChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type AdminChangePasswordResponse = {
  success: boolean;
};

export type AdminCsrfResponse = {
  csrfToken: string;
};

export type AdminLogoutResponse = {
  success: boolean;
};
