"""Seule couche qui touche la DB. routes/controllers/services ne doivent
jamais importer sqlalchemy directement, uniquement les fonctions de
repositories/*.
"""

from __future__ import annotations

from collections.abc import Generator
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.config import settings


def _to_sqlalchemy_url(database_url: str) -> str:
    """DATABASE_URL est au format Prisma (postgresql://..., ?schema=public) ;
    psycopg n'accepte pas le parametre 'schema' dans la query string."""
    parts = urlsplit(database_url)
    query = urlencode([(key, value) for key, value in parse_qsl(parts.query) if key != "schema"])
    return urlunsplit(("postgresql+psycopg", parts.netloc, parts.path, query, parts.fragment))


engine = create_engine(_to_sqlalchemy_url(settings.database_url), pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_session() -> Generator[Session, None, None]:
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
