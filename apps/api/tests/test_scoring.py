"""Tests unitaires purs (pas de DB) pour la formule "meilleur deal"."""

from __future__ import annotations

from decimal import Decimal

from app.repositories.models import Offer, Vendor
from app.services.scoring import best_offer, score_offer


def _make_offer(*, price: str, shipping_cost: str | None, trust_score: float | None, stock_status: str) -> Offer:
    vendor = Vendor(id="v1", name="Test Vendor", logo=None, trust_score=trust_score, avg_delivery_time=None)
    offer = Offer(
        id="o1",
        product_id="p1",
        vendor_id="v1",
        price=Decimal(price),
        stock_status=stock_status,
        url="https://example.tn/produit",
        shipping_cost=Decimal(shipping_cost) if shipping_cost is not None else None,
        scraped_at=None,
    )
    offer.vendor = vendor
    return offer


def test_lower_price_wins_when_trust_and_stock_equal() -> None:
    cheap = _make_offer(price="100", shipping_cost=None, trust_score=3.0, stock_status="in_stock")
    expensive = _make_offer(price="150", shipping_cost=None, trust_score=3.0, stock_status="in_stock")
    assert score_offer(cheap) < score_offer(expensive)
    assert best_offer([cheap, expensive]) is cheap


def test_trust_score_breaks_ties_on_close_prices() -> None:
    low_trust = _make_offer(price="100", shipping_cost=None, trust_score=1.0, stock_status="in_stock")
    high_trust = _make_offer(price="100", shipping_cost=None, trust_score=5.0, stock_status="in_stock")
    assert score_offer(high_trust) < score_offer(low_trust)


def test_trust_score_cannot_overcome_a_much_higher_price() -> None:
    cheap_untrusted = _make_offer(price="100", shipping_cost=None, trust_score=0.0, stock_status="in_stock")
    expensive_trusted = _make_offer(price="200", shipping_cost=None, trust_score=5.0, stock_status="in_stock")
    assert score_offer(cheap_untrusted) < score_offer(expensive_trusted)


def test_out_of_stock_is_penalized_vs_in_stock_at_same_price() -> None:
    in_stock = _make_offer(price="100", shipping_cost=None, trust_score=3.0, stock_status="in_stock")
    out_of_stock = _make_offer(price="100", shipping_cost=None, trust_score=3.0, stock_status="out_of_stock")
    assert score_offer(in_stock) < score_offer(out_of_stock)
    assert best_offer([in_stock, out_of_stock]) is in_stock


def test_missing_shipping_cost_treated_as_zero() -> None:
    no_shipping = _make_offer(price="100", shipping_cost=None, trust_score=3.0, stock_status="in_stock")
    zero_shipping = _make_offer(price="100", shipping_cost="0", trust_score=3.0, stock_status="in_stock")
    assert score_offer(no_shipping) == score_offer(zero_shipping)


def test_shipping_cost_increases_landed_cost() -> None:
    no_shipping = _make_offer(price="100", shipping_cost="0", trust_score=3.0, stock_status="in_stock")
    with_shipping = _make_offer(price="100", shipping_cost="20", trust_score=3.0, stock_status="in_stock")
    assert score_offer(no_shipping) < score_offer(with_shipping)


def test_missing_trust_score_falls_back_to_default() -> None:
    explicit_default = _make_offer(price="100", shipping_cost=None, trust_score=3.0, stock_status="in_stock")
    missing = _make_offer(price="100", shipping_cost=None, trust_score=None, stock_status="in_stock")
    assert score_offer(explicit_default) == score_offer(missing)
