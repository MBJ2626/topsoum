from decimal import Decimal

from vendors.spacenet import mapper


def test_parse_price_simple():
    assert mapper.parse_price("399,000 DT") == Decimal("399.000")


def test_parse_price_clean_attribute_value():
    assert mapper.parse_price("1199") == Decimal("1199")


def test_parse_price_missing():
    assert mapper.parse_price(None) is None
    assert mapper.parse_price("") is None


def test_parse_stock_status_from_text():
    assert mapper.parse_stock_status(stock_text="En stock") == "in_stock"
    assert mapper.parse_stock_status(stock_text="Rupture de stock") == "out_of_stock"
    assert mapper.parse_stock_status(stock_text="En Arrivage") == "unknown"
    assert mapper.parse_stock_status() == "unknown"


def test_parse_stock_status_from_availability_href():
    assert mapper.parse_stock_status(availability_href="https://schema.org/InStock") == "in_stock"
    assert mapper.parse_stock_status(availability_href="https://schema.org/OutOfStock") == "out_of_stock"
    assert mapper.parse_stock_status(availability_href="https://schema.org/BackOrder") == "unknown"
    assert mapper.parse_stock_status(availability_href="https://schema.org/PreOrder") == "unknown"


def test_clean_reference_strips_whitespace():
    assert mapper.clean_reference("  ITEL-S23-8/256-WH  ") == "ITEL-S23-8/256-WH"
    assert mapper.clean_reference(None) is None


def test_map_listing_item_builds_standard_offer():
    raw = {
        "external_id": "66179",
        "name": "Smartphone Itel S23 8Go 256Go Blanc",
        "url": "https://spacenet.tn/smartphone-tunisie/66179-smartphone-itel-s23-8go-256go-blanc.html",
        "reference": "ITEL-S23-8/256-WH",
        "price_text": "399,000 DT",
        "stock_text": "En stock",
        "image_url": "https://spacenet.tn/174832-home_default/smartphone-itel-s23-8go-256go-blanc.jpg",
        "brand": "Itel",
    }

    offer = mapper.map_listing_item(raw, category="smartphones")

    assert offer is not None
    assert offer["vendor"] == "spacenet"
    assert offer["external_id"] == "66179"
    assert offer["price"] == 399.0
    assert offer["currency"] == "TND"
    assert offer["stock_status"] == "in_stock"
    assert offer["category"] == "smartphones"
    assert offer["reference"] == "ITEL-S23-8/256-WH"


def test_map_listing_item_returns_none_without_price():
    raw = {"external_id": "1", "url": "https://x", "price_text": None}
    assert mapper.map_listing_item(raw, category="smartphones") is None


def test_map_product_page_builds_standard_offer():
    """Fixture basee sur le JSON-LD schema.org/Product reel de la fiche Oppo A6
    (etat "BackOrder" -> stock_status "unknown"), cf. scraper.py _extract_product_page."""
    raw = {
        "external_id": 97444,
        "name": "Smartphone Oppo A6 8Go 256Go 5G Gold",
        "price_text": "1199.00",
        "currency": "TND",
        "availability_href": "https://schema.org/BackOrder",
        "reference": "OPPO-A6-8/256-5G-GOLD",
        "brand": "Oppo",
        "image_url": "https://spacenet.tn/344912-large_default/smartphone-oppo-a6-8go-256go-5g-gold.jpg",
    }
    url = "https://spacenet.tn/smartphone-tunisie/97444-smartphone-oppo-a6-8go-256go-5g-gold.html"

    offer = mapper.map_product_page(raw, category="smartphones", url=url)

    assert offer is not None
    assert offer["vendor"] == "spacenet"
    assert offer["external_id"] == "97444"
    assert offer["price"] == 1199.0
    assert offer["stock_status"] == "unknown"
    assert offer["url"] == url


def test_map_product_page_in_stock_from_json_ld():
    """Fixture basee sur le JSON-LD reel de la fiche Lesia Young 1 (InStock)."""
    raw = {
        "external_id": 95003,
        "name": "Smartphone Lesia Young 1 2Go 16Go Bleu",
        "price_text": "169.90",
        "currency": "TND",
        "availability_href": "https://schema.org/InStock",
        "reference": "LESIA-YOUNG1-DARKBLUE",
        "brand": "Lesia",
        "image_url": "https://spacenet.tn/327245-large_default/smartphone-lesia-young-1-2go-16go-bleu.jpg",
    }
    url = "https://spacenet.tn/smartphone-tunisie/95003-smartphone-lesia-young-1-2go-16go-bleu.html"

    offer = mapper.map_product_page(raw, category="smartphones", url=url)

    assert offer is not None
    assert offer["price"] == 169.9
    assert offer["stock_status"] == "in_stock"


def test_to_large_image_url_upgrades_listing_thumbnail():
    thumb = "https://spacenet.tn/455543-home_default/smartphone-lesia-young-1.jpg"
    assert mapper.to_large_image_url(thumb) == "https://spacenet.tn/455543-large_default/smartphone-lesia-young-1.jpg"


def test_to_large_image_url_keeps_other_urls_and_none():
    already_large = "https://spacenet.tn/455543-large_default/x.jpg"
    assert mapper.to_large_image_url(already_large) == already_large
    assert mapper.to_large_image_url(None) is None
    assert mapper.to_large_image_url("") is None
