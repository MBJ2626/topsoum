"""Rate-limiting en memoire (slowapi), adapte a une instance FastAPI unique
(V1). Si l'API est scalee horizontalement, un backend Redis (deja
provisionne dans docker-compose.yml) devra remplacer le stockage memoire.
"""

from __future__ import annotations

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address, default_limits=["120/minute"])
