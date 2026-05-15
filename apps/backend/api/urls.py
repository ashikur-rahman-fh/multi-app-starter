from django.urls import path, re_path

from .views import api_not_found, health, hello

urlpatterns = [
    path("health/", health, name="health"),
    path("hello/", hello, name="hello"),
    re_path(r"^.*$", api_not_found, name="api-not-found"),
]
