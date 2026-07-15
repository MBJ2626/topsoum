"""Selecteurs CSS pour mytek.tn (Magento). Rien d'autre ici.

Verifies manuellement sur https://www.mytek.tn/smartphone.html et une fiche
produit (smartphone-samsung-galaxy-a56-5g-8go-256go-graphite.html) le
2026-07-15. A mettre a jour ici uniquement si MyTek change son HTML - aucun
autre fichier ne doit connaitre ces selecteurs.

Note robots.txt : mytek.tn interdit "Disallow: /*?" - toute URL avec query
string (pagination ?categoryId=..&p=2, filtres) est bloquee. scrape_category
ne peut donc recolter que la 1ere page de resultats (~48 produits pour
smartphones) tant que ce robots.txt n'evolue pas.
"""

# Chemin des categories (relatif a la base_url du vendeur)
CATEGORY_SLUGS: dict[str, str] = {
    "smartphones": "smartphone.html",
}

# -- Page de listing (categorie) -----------------------------------------
# Les donnees sont exposees, rendues cote serveur, dans un bloc SEO cache
# (#seo-product-data) - source plus fiable que le widget JS de resultats,
# qui lui n'existe qu'apres injection JS.

LISTING_PRODUCT_ITEM = "#seo-product-data > div[data-id]"
LISTING_NEXT_PAGE_LINK = "nav.custom-pagination a.page-link:last-of-type"

# -- Page produit -----------------------------------------------------------

PRODUCT_NAME = "h1.page-title span[itemprop='name']"
PRODUCT_PRICE_META = "meta[itemprop='price']"
PRODUCT_CURRENCY_META = "meta[itemprop='priceCurrency']"
PRODUCT_AVAILABILITY_LINK = "link[itemprop='availability']"
PRODUCT_REFERENCE = ".product.attribute.sku .value[itemprop='sku']"
PRODUCT_BRAND_LOGO = ".product-info-stock-sku a img"
PRODUCT_IMAGE_META = "meta[property='og:image']"
PRODUCT_ID_INPUT = "input[name='product']"
PRODUCT_BREADCRUMB_LINKS = "div.breadcrumbs a.customBreadCrumbItem"
