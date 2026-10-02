# antislop audit 001, follow-up (2026-10-02)

All 22 findings approved and fixed on branch `fix/antislop-audit-001`. `DESIGN.md` and `docs/PROJET.md` updated to match the four owner decisions.

## Fixes

1. SearchBar is an ARIA combobox: focus stays in the field, Up/Down move, Enter opens, Escape closes; the tray closes only when focus leaves the whole search.
2. RAM select hidden while the API returns no RAM options.
3. Search page loads the session and favorites (`lib/favorites-server.ts`, shared with the product page); the star shows only when signed in, with the real state.
4. Em dashes removed from UI text; titles use "|" (`%s | TopSoum`); admin placeholders read "n/d".
5. Axis ticks use Muted `#5f646d` (5.95:1).
6. Header search key and input 44px (shell padding 4px); retry links 44px tall.
7. `displayPrice()` in `lib/format.ts` used by every price display that lacked the guard.
8. BestDealCard names a cheaper offer and why ("rupture de stock", "stock non confirmé", "hors frais de livraison", "revendeur moins bien noté").
9. BestDealCard takes `headingLevel` (h1 on the product page, h2 elsewhere); every page state renders in `<main>`.
10. New `field` token `#80868f` (3.67:1 on white, 3.21:1 on shelf) for fields, selects and search shells.
11. Search shell carries the global 2px ultramarine ring while the input has focus.
12. Header star key to `/favorites`; French sign-in page at `/connexion` (credentials plus configured OAuth); sign-out on the favorites page; middleware and NextAuth point to `/connexion`.
13. Home section renamed "Comparatifs".
14. Error page: fixed French copy on a face, retry key, no 100vh.
15. `buttonClasses()` shared by `Button`, links styled as keys, ErrorState, FilterPanel, 404.
16. Admin keys secondary at 14px; matching queue first, then scrapers, then stats.
17. Favorites copy uses "vous".
18. Offers are real links (`target="_blank"`) with "(nouvel onglet)" for screen readers; click tracking kept.
19. "Comparé chez" is its own `dl`; "Prix en dinars (TND)" a separate `p`.
20. Chart skeleton is a plain block; pulses stop under reduced motion.
21. Spec rows wrap long values.
22. Comments trimmed or moved, "prompt 11" removed, stray `.gitkeep` deleted.

Also fixed during verification: at 360px the new star key squeezed the header search to about 80px, so the header wordmark shows only its glyph below 420px.

## Verification (R-35)

- `tsc --noEmit` and `eslint .`: clean. `next build`: passes.
- Playwright `e2e/full-journey.spec.ts` against the mock API: 1 passed.
- Click-through on the production build with the mock API:
  - home: type "iph", ArrowDown highlights option 0 (`aria-activedescendant` set), Tab to the submit key keeps the tray open, Escape closes it, ArrowDown plus Enter opens `/product/e2e-product-1`
  - suggestion mouse click from `/search` opens the product
  - product page has one h1 (product name)
  - header star opens `/connexion?callbackUrl=/favorites`; a failed sign-in returns with a French alert
  - signed-out search shows no star; filter panel shows no RAM select
  - title reads `« iphone » au meilleur prix | TopSoum`
  - at 360px, `/`, `/search`, `/product`, `/connexion`, 404 and a landing page: 0px horizontal overflow, no control under 44px
  - no console or page errors
- Cheaper-offer note checked on sample offers for all four reasons and for the no-note case.

## Not verified

- Real sign-in success (no database in the test setup) and the OAuth buttons (no provider keys configured).
- Real Android devices; layout checked in Chromium at 360px only.
