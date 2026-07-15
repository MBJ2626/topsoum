from decimal import Decimal

from vendors.mytek import mapper


def test_parse_price_plain_integer():
    assert mapper.parse_price("1899") == Decimal("1899")


def test_parse_price_with_thousands_separator_and_currency():
    assert mapper.parse_price("1 899,000 DT") == Decimal("1899.000")


def test_parse_price_missing():
    assert mapper.parse_price(None) is None
    assert mapper.parse_price("") is None


def test_parse_stock_status_from_availability_href():
    assert mapper.parse_stock_status(availability_href="https://schema.org/InStock") == "in_stock"
    assert mapper.parse_stock_status(availability_href="https://schema.org/OutOfStock") == "out_of_stock"


def test_parse_stock_status_from_text():
    assert mapper.parse_stock_status(stock_text="En stock") == "in_stock"
    assert mapper.parse_stock_status(stock_text="Epuisé") == "out_of_stock"
    assert mapper.parse_stock_status(stock_text="En arrivage") == "unknown"
    assert mapper.parse_stock_status() == "unknown"


def test_resolve_image_url_relative():
    assert (
        mapper.resolve_image_url("/s/m/smartphone-xiaomi-redmi-a7-pro-4g-4go-64go-palm-green.jpg")
        == "https://www.mytek.tn/media/catalog/product/s/m/smartphone-xiaomi-redmi-a7-pro-4g-4go-64go-palm-green.jpg"
    )


def test_map_listing_item_builds_standard_offer():
    raw = {
        "external_id": "77236",
        "name": "Smartphone Xiaomi Redmi A7 Pro 4G 4Go 64Go - Palm Green",
        "url": "https://www.mytek.tn/smartphone-xiaomi-redmi-a7-pro-4g-4go-64go-palm-green.html",
        "reference": "REDMI-A7PRO-4/64-PGREEN",
        "final_price": "439",
        "image_url": "/s/m/smartphone-xiaomi-redmi-a7-pro-4g-4go-64go-palm-green-l.jpg",
        "stock_text": "En stock",
        "brand": "XIAOMI",
    }

    offer = mapper.map_listing_item(raw, category="smartphones")

    assert offer is not None
    assert offer["vendor"] == "mytek"
    assert offer["external_id"] == "77236"
    assert offer["price"] == 439.0
    assert offer["currency"] == "TND"
    assert offer["stock_status"] == "in_stock"
    assert offer["category"] == "smartphones"
    assert offer["brand"] == "XIAOMI"
    assert offer["reference"] == "REDMI-A7PRO-4/64-PGREEN"


def test_map_listing_item_uses_final_price_not_old_price():
    raw = {
        "external_id": "64074",
        "name": "Smartphone VIVO Y04 8Go 128Go - Vert jade",
        "url": "https://www.mytek.tn/smartphone-vivo-y04-4go-128go-vert-jade.html",
        "reference": "VIVO-Y04-4/128-JGR",
        "final_price": "409",
        "stock_text": "En stock",
        "brand": "VIVO",
    }

    offer = mapper.map_listing_item(raw, category="smartphones")

    assert offer is not None
    assert offer["price"] == 409.0


def test_map_listing_item_returns_none_without_price():
    raw = {"external_id": "1", "url": "https://x", "final_price": None}
    assert mapper.map_listing_item(raw, category="smartphones") is None


def test_map_product_page_builds_standard_offer():
    raw = {
        "external_id": "57986",
        "name": "Smartphone SAMSUNG Galaxy A56 5G 16Go 256Go - Graphite",
        "price_text": "1899",
        "currency": "TND",
        "availability_href": "https://schema.org/InStock",
        "reference": "SM-A56-5G-8/256-GRAPHITE",
        "brand": "samsung",
        "image_url": "https://mk-media.mytek.tn/media/catalog/product/cache/xxx/smartphone.jpg",
    }
    url = "https://www.mytek.tn/smartphone-samsung-galaxy-a56-5g-8go-256go-graphite.html"

    offer = mapper.map_product_page(raw, category="smartphones", url=url)

    assert offer is not None
    assert offer["vendor"] == "mytek"
    assert offer["external_id"] == "57986"
    assert offer["price"] == 1899.0
    assert offer["stock_status"] == "in_stock"
    assert offer["url"] == url
