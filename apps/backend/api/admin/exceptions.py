from rest_framework import status
from rest_framework.exceptions import APIException

from .constants import (
    ADMIN_FORBIDDEN_CODE,
    ADMIN_FORBIDDEN_MESSAGE,
    INVALID_CREDENTIALS_CODE,
    INVALID_CREDENTIALS_MESSAGE,
    INVALID_CURRENT_PASSWORD_CODE,
    INVALID_CURRENT_PASSWORD_MESSAGE,
    WEAK_PASSWORD_CODE,
    WEAK_PASSWORD_MESSAGE,
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


class InvalidCurrentPassword(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_code = INVALID_CURRENT_PASSWORD_CODE
    default_detail = INVALID_CURRENT_PASSWORD_MESSAGE


class WeakPassword(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_code = WEAK_PASSWORD_CODE
    default_detail = WEAK_PASSWORD_MESSAGE
