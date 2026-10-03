"""Formule "meilleur deal" : prix + frais de livraison + fiabilite vendeur.

Le cout reellement paye (prix + livraison) domine le score et reste
directement lisible en TND (pas de normalisation arbitraire qui rendrait le
score illisible). Le trust_score n'agit que comme un correcteur borne a
+/-5% : assez pour departager deux offres a prix proche, jamais assez pour
faire remonter une offre nettement plus chere. La penalite de stock est un
multiplicateur (x1.5 en rupture) : une offre en rupture ne l'emporte que si
elle est nettement moins chere (environ un tiers) que l'offre en stock.

Un prix <= 0 est douteux (docs/PROJET.md 9.2) : il n'est jamais elu meilleur
deal tant qu'une offre a prix fiable existe.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.repositories.models import Offer

DEFAULT_TRUST_SCORE = 3.0
MAX_TRUST_SCORE = 5.0
TRUST_WEIGHT = 0.05

STOCK_PENALTY = {
    "in_stock": 1.0,
    "unknown": 1.1,
    "out_of_stock": 1.5,
}
DEFAULT_STOCK_PENALTY = 1.1


def score_offer(offer: Offer) -> float:
    landed_cost = float(offer.price) + float(offer.shipping_cost or 0)

    trust = offer.vendor.trust_score if offer.vendor.trust_score is not None else DEFAULT_TRUST_SCORE
    trust_ratio = max(0.0, min(trust, MAX_TRUST_SCORE)) / MAX_TRUST_SCORE
    trust_adjustment = 1 - TRUST_WEIGHT * trust_ratio

    stock_penalty = STOCK_PENALTY.get(offer.stock_status, DEFAULT_STOCK_PENALTY)

    return landed_cost * trust_adjustment * stock_penalty


def best_offer(offers: list[Offer]) -> Offer:
    return min(offers, key=score_offer)


def has_reliable_price(offer: Offer) -> bool:
    return offer.price > 0


def rank_offers(offers: list[Offer]) -> list[Offer]:
    """Offres a prix fiable par score croissant, puis les prix douteux (ordre d'origine)."""
    reliable = sorted((offer for offer in offers if has_reliable_price(offer)), key=score_offer)
    return reliable + [offer for offer in offers if not has_reliable_price(offer)]


def best_deal(offers: list[Offer]) -> Offer:
    """Meilleure offre a prix fiable ; a defaut, la premiere offre (prix a signaler comme indisponible)."""
    return rank_offers(offers)[0]


def deal_rank(offers: list[Offer]) -> tuple[int, float]:
    """Cle de tri des produits : ceux sans aucun prix fiable passent apres tous les autres."""
    deal = best_deal(offers)
    return (0, score_offer(deal)) if has_reliable_price(deal) else (1, 0.0)
