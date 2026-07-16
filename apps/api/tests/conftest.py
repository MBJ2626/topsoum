from __future__ import annotations

from collections.abc import Iterator

import jwt
import pytest
from sqlalchemy.orm import Session

from app.config import settings
from app.repositories.database import SessionLocal


def make_bearer_token(user_id: str, *, is_admin: bool = False) -> str:
    """Simule le token backend HS256 mine cote Next.js (voir apps/web/lib/auth-token.ts)."""
    payload = {"sub": user_id, "isAdmin": is_admin}
    return jwt.encode(payload, settings.api_auth_secret, algorithm="HS256")


def auth_headers(user_id: str, *, is_admin: bool = False) -> dict[str, str]:
    return {"Authorization": f"Bearer {make_bearer_token(user_id, is_admin=is_admin)}"}


@pytest.fixture
def db_session() -> Iterator[Session]:
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
