from rest_framework.authentication import SessionAuthentication


class AdminSessionAuthentication(SessionAuthentication):
    """Session auth for admin API; CSRF required only on unsafe HTTP methods."""

    unsafe_methods = frozenset({"POST", "PUT", "PATCH", "DELETE"})

    def enforce_csrf(self, request):
        if request.method not in self.unsafe_methods:
            return
        super().enforce_csrf(request)
