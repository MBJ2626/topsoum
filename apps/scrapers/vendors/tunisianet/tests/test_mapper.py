from decimal import Decimal

from vendors.tunisianet import mapper


def test_parse_price_simple():
    assert mapper.parse_price("169,000 DT") == Decimal("169.000")


def test_parse_price_with_thousands_separator_and_trailing_text():
    assert mapper.parse_price("1 299,000 DT\n\t\t\t\tTTC") == Decimal("1299.000")


def test_parse_price_missing():
    assert mapper.parse_price(None) is None
    assert mapper.parse_price("") is None


def test_parse_stock_status_from_availability_href():
    assert mapper.parse_stock_status(None, "https://schema.org/InStock") == "in_stock"
    assert mapper.parse_stock_status(None, "https://schema.org/OutOfStock") == "out_of_stock"


def test_parse_stock_status_from_class():
    assert mapper.parse_stock_status("in-stock") == "in_stock"
    assert mapper.parse_stock_status("out-of-stock") == "out_of_stock"
    assert mapper.parse_stock_status(None) == "unknown"


def test_clean_reference_strips_brackets():
    assert mapper.clean_reference("[LESIA-YOUNG1-BL]") == "LESIA-YOUNG1-BL"
    assert mapper.clean_reference(None) is None


def test_map_listing_item_builds_standard_offer():
    raw = {
        "external_id": "91033",
        "name": "Smartphone Lesia Young 1 | 2Go / 16Go | Bleu",
        "url": "https://www.tunisianet.com.tn/smartphone-tunisie/91033-smartphone-lesia-young-1-2go-16go-bleu.html",
        "reference": "[LESIA-YOUNG1-BL]",
        "price_text": "169,000 DT",
        "stock_class": "in-stock",
        "image_url": "https://www.tunisianet.com.tn/455543-home_default/smartphone-lesia-young-1-2go-16go-bleu.jpg",
        "brand": "Lesia",
    }

    offer = mapper.map_listing_item(raw, category="smartphones")

    assert offer is not None
    assert offer["vendor"] == "tunisianet"
    assert offer["external_id"] == "91033"
    assert offer["price"] == 169.0
    assert offer["currency"] == "TND"
    assert offer["stock_status"] == "in_stock"
    assert offer["category"] == "smartphones"
    assert offer["reference"] == "LESIA-YOUNG1-BL"


def test_map_listing_item_returns_none_without_price():
    raw = {"external_id": "1", "url": "https://x", "price_text": None}
    assert mapper.map_listing_item(raw, category="smartphones") is None


def test_to_large_image_url_upgrades_listing_thumbnail():
    thumb = "https://www.tunisianet.com.tn/455543-home_default/smartphone-lesia-young-1.jpg"
    assert mapper.to_large_image_url(thumb) == "https://www.tunisianet.com.tn/455543-large_default/smartphone-lesia-young-1.jpg"


def test_to_large_image_url_keeps_other_urls_and_none():
    already_large = "https://www.tunisianet.com.tn/455543-large_default/x.jpg"
    assert mapper.to_large_image_url(already_large) == already_large
    assert mapper.to_large_image_url(None) is None
    assert mapper.to_large_image_url("") is None
