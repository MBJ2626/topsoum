"""Verifie le token backend HS256 mine cote Next.js (voir apps/web/lib/auth-token.ts).
Ne decode PAS le cookie de session JWE natif d'Auth.js : le contrat est un
Bearer token separe, court-vecu, signe avec API_AUTH_SECRET.
"""

from __future__ import annotations

from typing import Annotated

import jwt
from fastapi import Depends, Header, HTTPException
from pydantic import BaseModel

from app.config import settings


class CurrentUser(BaseModel):
    id: str
    is_admin: bool


def get_current_user(authorization: Annotated[str | None, Header()] = None) -> CurrentUser:
    if authorization is None or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentification requise")

    token = authorization.removeprefix("Bearer ").strip()
    try:
        payload = jwt.decode(token, settings.api_auth_secret, algorithms=["HS256"])
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=401, detail="Token invalide ou expire") from exc

    return CurrentUser(id=payload["sub"], is_admin=bool(payload.get("isAdmin", False)))


def require_admin(current_user: Annotated[CurrentUser, Depends(get_current_user)]) -> CurrentUser:
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Reserve a l'administrateur")
    return current_user
