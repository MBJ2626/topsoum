"""Init Sentry au bootstrap (app/main.py). Pas de logique metier ici : les
services ne doivent jamais savoir qu'un SDK d'observabilite existe."""

from __future__ import annotations

import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

from app.config import settings


def init_sentry() -> None:
    if not settings.sentry_dsn:
        return
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        environment=settings.sentry_environment,
        integrations=[FastApiIntegration()],
        traces_sample_rate=1.0,
    )
