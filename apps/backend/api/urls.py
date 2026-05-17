from django.urls import path, re_path

from .views import api_not_found, health, hello, public_meta

urlpatterns = [
    path("health/", health, name="health"),
    path("hello/", hello, name="hello"),
    path("public/meta/", public_meta, name="public-meta"),
    re_path(r"^.*$", api_not_found, name="api-not-found"),
]
