"""Rate-limiting en memoire (slowapi), adapte a une instance FastAPI unique
(V1). Si l'API est scalee horizontalement, un backend Redis (deja
provisionne dans docker-compose.yml) devra remplacer le stockage memoire.

Cle de limitation : l'IP du visiteur, pas celle du serveur Next.js par lequel
passent toutes les requetes (sinon la limite serait partagee par tout le
site). Next transmet l'IP dans CLIENT_IP_HEADER, signee HMAC avec
API_AUTH_SECRET : un client qui appelle l'API directement ne peut pas
choisir son IP pour contourner la limite.
"""

from __future__ import annotations

import hashlib
import hmac
import ipaddress

from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request

from app.config import settings

CLIENT_IP_HEADER = "x-topsoum-client-ip"
CLIENT_IP_SIGNATURE_HEADER = "x-topsoum-client-ip-signature"


def sign_client_ip(ip: str, secret: str) -> str:
    return hmac.new(secret.encode(), ip.encode(), hashlib.sha256).hexdigest()


def client_ip_key(request: Request) -> str:
    ip = request.headers.get(CLIENT_IP_HEADER)
    signature = request.headers.get(CLIENT_IP_SIGNATURE_HEADER)
    if ip and signature:
        try:
            ipaddress.ip_address(ip)
        except ValueError:
            return get_remote_address(request)
        if hmac.compare_digest(sign_client_ip(ip, settings.api_auth_secret), signature):
            return ip
    return get_remote_address(request)


limiter = Limiter(key_func=client_ip_key, default_limits=["120/minute"])
