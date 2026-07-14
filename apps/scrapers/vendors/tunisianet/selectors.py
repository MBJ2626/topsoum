"""Selecteurs CSS pour tunisianet.com.tn (theme PrestaShop). Rien d'autre ici.

Verifies manuellement sur https://www.tunisianet.com.tn/596-smartphone-tunisie
et une fiche produit le 2026-07-14. A mettre a jour ici uniquement si
Tunisianet change son HTML - aucun autre fichier ne doit connaitre ces
selecteurs.
"""

# Chemin des categories (relatif a la base_url du vendeur)
CATEGORY_SLUGS: dict[str, str] = {
    "smartphones": "596-smartphone-tunisie",
}

# -- Page de listing (categorie) ---------------------------------------

LISTING_PRODUCT_CARD = "article.product-miniature"
LISTING_NEXT_PAGE_LINK = "a.next.js-search-link"

LISTING_NAME_LINK = "h2.product-title a"
LISTING_REFERENCE = ".product-reference"
LISTING_PRICE = ".product-price-and-shipping [itemprop='price']"
LISTING_STOCK = "#stock_availability span"
LISTING_IMAGE = "img.thumbnail-img"
LISTING_BRAND_LOGO = ".product-manufacturer img"

# -- Page produit ---------------------------------------------------------

PRODUCT_NAME = "h1.product-head1"
PRODUCT_ID_INPUT = "#product_page_product_id"
PRODUCT_PRICE = ".product-price [itemprop='price']"
PRODUCT_AVAILABILITY_LINK = "link[itemprop='availability']"
PRODUCT_STOCK_FALLBACK = "#stock_availability span"
PRODUCT_REFERENCE = "[itemprop='sku']"
PRODUCT_BRAND_LOGO = ".product-manufacturer img"
PRODUCT_IMAGE_META = "meta[property='og:image']"
PRODUCT_BREADCRUMB_LINKS = "nav.breadcrumb a"
