"""Selecteurs CSS pour spacenet.tn (PrestaShop). Rien d'autre ici.

Verifies manuellement sur https://www.spacenet.tn/130-smartphone-tunisie et
une fiche produit (smartphone-tunisie/97444-smartphone-oppo-a6-8go-256go-5g-
gold.html) le 2026-07-15. A mettre a jour ici uniquement si Spacenet change
son HTML - aucun autre fichier ne doit connaitre ces selecteurs.

Note DOM : chaque carte produit du listing est rendue DEUX FOIS cote serveur
(une variante grille avec la classe "item-inner", une variante liste sans
cette classe, toggle via CSS). LISTING_PRODUCT_CARD cible uniquement la
variante grille (".item-inner") pour eviter les doublons.
"""

# Pages de listing de chaque categorie (relatives a la base_url du vendeur),
# parcourues dans l'ordre par scrape_category. Spacenet range les iPhone sous
# /211-iphone-tunisie, jamais sous /130-smartphone-tunisie (verifie le
# 2026-10-01, autorise par robots.txt) : les deux pages forment "smartphones".
CATEGORY_SLUGS: dict[str, tuple[str, ...]] = {
    "smartphones": ("130-smartphone-tunisie", "211-iphone-tunisie"),
}

# Alias de fil d'ariane vus sur des fiches produit qui ne remontent jamais a
# CATEGORY_SLUGS (ex: les iPhone sont ranges sous /211-iphone-tunisie, jamais
# sous /130-smartphone-tunisie) mais partagent une categorie parente commune
# ("13-smartphone-mobile-tunisie") avec les autres smartphones.
CATEGORY_BREADCRUMB_ALIASES: dict[str, str] = {
    "13-smartphone-mobile-tunisie": "smartphones",
}

# -- Page de listing (categorie) ---------------------------------------

LISTING_PRODUCT_CARD = ".product-miniature.item-inner"
LISTING_NEXT_PAGE_LINK = "a.next.js-search-link"

LISTING_NAME_LINK = "h2.product_name a"
LISTING_REFERENCE = ".product-reference span"
LISTING_PRICE = ".product-price-and-shipping .price"
LISTING_STOCK = ".product-quantities label"
LISTING_IMAGE = "img.product_image"
LISTING_BRAND_LOGO = ".product-manufacturer img"

# -- Page produit -----------------------------------------------------------
# Le DOM expose DEUX blocs de disponibilite differents selon l'etat du produit
# (#product-availability seulement en precommande/reassort, .product-quantities
# uniquement dans le carrousel "produits similaires" - PAS le produit principal
# quand il est simplement en stock). Source fiable et unique retenue : le bloc
# JSON-LD schema.org/Product, present et coherent quel que soit l'etat
# (InStock / BackOrder / PreOrder / OutOfStock).

PRODUCT_JSON_LD_SCRIPTS = "script[type='application/ld+json']"
PRODUCT_BREADCRUMB_LINKS = "nav.breadcrumb ol li a"
