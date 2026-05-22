from django.urls import path, re_path

from .admin.auth_views import admin_change_password, admin_csrf, admin_login, admin_logout, admin_me
from .views import api_not_found, health, hello, public_meta

urlpatterns = [
    path("health/", health, name="health"),
    path("hello/", hello, name="hello"),
    path("public/meta/", public_meta, name="public-meta"),
    path("admin/auth/csrf/", admin_csrf, name="admin-auth-csrf"),
    path("admin/auth/login/", admin_login, name="admin-auth-login"),
    path("admin/auth/logout/", admin_logout, name="admin-auth-logout"),
    path("admin/auth/me/", admin_me, name="admin-auth-me"),
    path("admin/auth/change-password/", admin_change_password, name="admin-auth-change-password"),
    re_path(r"^.*$", api_not_found, name="api-not-found"),
]
