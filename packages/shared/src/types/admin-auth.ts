export type AdminUser = {
  id: number;
  name: string;
  username: string;
  email: string;
  isStaff: boolean;
  isSuperuser: boolean;
};

export type AdminLoginRequest = {
  usernameOrEmail: string;
  password: string;
};

export type AdminCsrfResponse = {
  csrfToken: string;
};

export type AdminLogoutResponse = {
  success: boolean;
};
