from rest_framework import status
from rest_framework.exceptions import APIException

from .constants import (
    ADMIN_FORBIDDEN_CODE,
    ADMIN_FORBIDDEN_MESSAGE,
    INVALID_CREDENTIALS_CODE,
    INVALID_CREDENTIALS_MESSAGE,
)


class InvalidAdminCredentials(APIException):
    status_code = status.HTTP_401_UNAUTHORIZED
    default_code = INVALID_CREDENTIALS_CODE
    default_detail = INVALID_CREDENTIALS_MESSAGE


class AdminForbidden(APIException):
    status_code = status.HTTP_403_FORBIDDEN
    default_code = ADMIN_FORBIDDEN_CODE
    default_detail = ADMIN_FORBIDDEN_MESSAGE


class AdminUnauthenticated(APIException):
    status_code = status.HTTP_401_UNAUTHORIZED
    default_code = "UNAUTHORIZED"
    default_detail = "You need to sign in to continue."
