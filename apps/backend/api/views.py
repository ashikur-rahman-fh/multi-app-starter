from rest_framework.decorators import api_view, throttle_classes
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .app_metadata import APP_METADATA


@api_view(["GET"])
@throttle_classes([])
def health(request):
    return Response({"status": "ok"})


@api_view(["GET"])
@throttle_classes([])
def public_meta(request):
    return Response(APP_METADATA)


class HelloView(APIView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "api"

    def get(self, request):
        return Response({"message": "Hello from Django backend"})


hello = HelloView.as_view()


@api_view(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"])
def api_not_found(request, unmatched=None):
    raise NotFound()
