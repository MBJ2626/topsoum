from __future__ import annotations

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_ROOT_ENV_FILE = Path(__file__).resolve().parents[3] / ".env"


class Settings(BaseSettings):
    database_url: str
    api_port: int = 8000

    model_config = SettingsConfigDict(env_file=_ROOT_ENV_FILE, env_file_encoding="utf-8", extra="ignore")


settings = Settings()
