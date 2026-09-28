"""Tests unitaires purs (pas de DB) pour favorites_service.to_result, qui
attache le "meilleur deal" (via scoring.best_offer) a un favori."""

from __future__ import annotations

from app.services.favorites_service import to_result
from tests.factories import make_favorite, make_offer, make_product


def test_to_result_attaches_best_offer_price_and_vendor_name() -> None:
    cheap = make_offer(
        id="o1", price="100", shipping_cost=None, trust_score=3.0, stock_status="in_stock", vendor_name="Tunisianet"
    )
    expensive = make_offer(
        id="o2", price="200", shipping_cost=None, trust_score=3.0, stock_status="in_stock", vendor_name="MyTek"
    )
    product = make_product(offers=[expensive, cheap])
    favorite = make_favorite(product=product)

    result = to_result(favorite)

    assert result.best_offer_price == cheap.price
    assert result.best_offer_vendor == "Tunisianet"


def test_to_result_with_single_offer_uses_it_directly() -> None:
    offer = make_offer(price="150", shipping_cost=None, trust_score=3.0, stock_status="in_stock", vendor_name="Spacenet")
    product = make_product(offers=[offer])
    favorite = make_favorite(product=product)

    result = to_result(favorite)

    assert result.best_offer_price == offer.price
    assert result.best_offer_vendor == "Spacenet"


def test_to_result_with_no_offers_returns_none_price_and_vendor() -> None:
    product = make_product(offers=[])
    favorite = make_favorite(product=product)

    result = to_result(favorite)

    assert result.best_offer_price is None
    assert result.best_offer_vendor is None


def test_to_result_picks_in_stock_over_cheaper_out_of_stock() -> None:
    cheaper_out_of_stock = make_offer(
        id="o1", price="90", shipping_cost=None, trust_score=3.0, stock_status="out_of_stock", vendor_name="MyTek"
    )
    pricier_in_stock = make_offer(
        id="o2", price="100", shipping_cost=None, trust_score=3.0, stock_status="in_stock", vendor_name="Tunisianet"
    )
    product = make_product(offers=[cheaper_out_of_stock, pricier_in_stock])
    favorite = make_favorite(product=product)

    result = to_result(favorite)

    assert result.best_offer_vendor == "Tunisianet"
