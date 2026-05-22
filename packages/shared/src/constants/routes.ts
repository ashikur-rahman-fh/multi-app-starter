export const API_ROUTES = {
  health: '/api/health/',
  hello: '/api/hello/',
  adminAuth: {
    csrf: '/api/admin/auth/csrf/',
    login: '/api/admin/auth/login/',
    logout: '/api/admin/auth/logout/',
    me: '/api/admin/auth/me/',
    changePassword: '/api/admin/auth/change-password/',
  },
} as const;
