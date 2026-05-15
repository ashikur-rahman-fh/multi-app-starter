from rest_framework.decorators import api_view
from rest_framework.exceptions import NotFound
from rest_framework.response import Response


@api_view(["GET"])
def health(request):
    return Response({"status": "ok"})


@api_view(["GET"])
def hello(request):
    return Response({"message": "Hello from Django backend"})


@api_view(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"])
def api_not_found(request, unmatched=None):
    raise NotFound()
