from __future__ import annotations

import random

from fastapi.testclient import TestClient
from starlette.requests import Request

from app.config import settings
from app.main import app
from app.middlewares.rate_limit import CLIENT_IP_HEADER, CLIENT_IP_SIGNATURE_HEADER, client_ip_key, sign_client_ip

client = TestClient(app)


def _request(headers: dict[str, str]) -> Request:
    scope = {
        "type": "http",
        "headers": [(name.encode(), value.encode()) for name, value in headers.items()],
        "client": ("10.0.0.5", 1234),
    }
    return Request(scope)


def _signed(ip: str) -> dict[str, str]:
    return {CLIENT_IP_HEADER: ip, CLIENT_IP_SIGNATURE_HEADER: sign_client_ip(ip, settings.api_auth_secret)}


def test_signed_client_ip_is_the_key() -> None:
    assert client_ip_key(_request(_signed("203.0.113.7"))) == "203.0.113.7"


def test_forged_or_invalid_ip_falls_back_to_the_connection_ip() -> None:
    forged = {CLIENT_IP_HEADER: "203.0.113.7", CLIENT_IP_SIGNATURE_HEADER: "0" * 64}
    assert client_ip_key(_request(forged)) == "10.0.0.5"
    assert client_ip_key(_request({CLIENT_IP_HEADER: "203.0.113.7"})) == "10.0.0.5"
    assert client_ip_key(_request(_signed("pas-une-ip"))) == "10.0.0.5"
    assert client_ip_key(_request({})) == "10.0.0.5"


def test_each_visitor_has_its_own_quota() -> None:
    """Toutes les requetes arrivent de la meme connexion (le serveur Next) :
    un visiteur qui epuise sa limite ne bloque pas les autres."""
    first, second = (f"198.51.100.{random.randint(1, 254)}", f"203.0.113.{random.randint(1, 254)}")
    statuses = [client.post("/offers/inconnue/click", headers=_signed(first)).status_code for _ in range(21)]
    assert statuses[:20] == [404] * 20
    assert statuses[20] == 429
    assert client.post("/offers/inconnue/click", headers=_signed(second)).status_code == 404
