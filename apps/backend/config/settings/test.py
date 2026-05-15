import os

from .base import *  # noqa: F403

DEBUG = False

DATABASES["default"]["TEST"] = {  # noqa: F405
    "NAME": os.environ.get("POSTGRES_DB", "starter_test") + "_pytest",
}
