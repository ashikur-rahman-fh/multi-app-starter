import json
import os
from dataclasses import dataclass
from typing import Any


def _parse_bool(value: str | None, *, default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class SuperuserSpec:
    username: str
    email: str
    password: str | None
    first_name: str
    last_name: str


def load_superuser_update_password_flag() -> bool:
    return _parse_bool(os.environ.get("ADMIN_SUPERUSER_UPDATE_PASSWORD"), default=False)


def load_superuser_specs_from_env() -> list[SuperuserSpec]:
    raw = os.environ.get("ADMIN_SUPERUSERS", "").strip()
    if not raw:
        raise ValueError(
            "ADMIN_SUPERUSERS is not set or empty. "
            "Provide a JSON array of superuser objects in the environment."
        )

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ValueError(f"ADMIN_SUPERUSERS is not valid JSON: {exc}") from exc

    if not isinstance(data, list):
        raise ValueError("ADMIN_SUPERUSERS must be a JSON array.")

    specs: list[SuperuserSpec] = []
    for index, entry in enumerate(data):
        if not isinstance(entry, dict):
            raise ValueError(f"ADMIN_SUPERUSERS[{index}] must be a JSON object.")
        specs.append(_parse_entry(entry, index))
    return specs


def _parse_entry(entry: dict[str, Any], index: int) -> SuperuserSpec:
    username = _required_str(entry, "username", index)
    email = _optional_str(entry, "email")
    password = _optional_str(entry, "password") or None
    first_name = _optional_str(entry, "first_name")
    last_name = _optional_str(entry, "last_name")
    return SuperuserSpec(
        username=username,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
    )


def _required_str(entry: dict[str, Any], key: str, index: int) -> str:
    value = entry.get(key)
    if not isinstance(value, str) or not value.strip():
        raise ValueError(
            f"ADMIN_SUPERUSERS[{index}].{key} is required and must be a non-empty string."
        )
    return value.strip()


def _optional_str(entry: dict[str, Any], key: str) -> str:
    value = entry.get(key)
    if value is None:
        return ""
    if not isinstance(value, str):
        raise ValueError(f"ADMIN_SUPERUSERS entry field '{key}' must be a string.")
    return value.strip()
