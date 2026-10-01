---
version: 1
slug: "apps-web-app-page-tsx"
primary_target: "apps/web/app/page.tsx"
related_targets: []
---

# Surface brief: homepage (and site-wide world)

Scope: apps/web homepage first, then the same world across search, product, favorites, admin, error and offline pages. Mode: Operate (the visitor's task is to start a search and get the best price).

Audience/job: mobile price-checker on a mid-range Android in daylight; types a model, wants the cheapest trustworthy offer fast. Constraint: one action above the fold on the homepage (search); one accent; one family, two weights (400/500); 44px targets; RTL-ready logical properties; Lighthouse mobile > 90.

User decisions (2026-10-01): whole-site redesign; accent and font freed from blue/system font but the one-accent / one-family-two-weights discipline stays; "tech" means modern electronics brand.

## Direction contract

THESIS: TopSoum presents every product the way electronics arrive: a clean white box face for the answer, and a printed side-label for the comparison. Refuses the category default of a bare Google-clone search page with blue links and grid tiles.

OWN-WORLD: Cool shelf-gray ground (#eef0f3) carrying matte white box faces (#ffffff, 16px corners, no shadows, crisp 1px edge). Ink #15171c, muted #5f646d. One electric ultramarine accent #3a5bff for the primary button, the "Meilleur prix" tab and focus. Savings green #0f7a55 only for "-X% vs moyenne". Readex Pro 400/500 (Latin now, Arabic coverage for later), tabular figures on every TND amount. Controls are 12px rounded rectangles like hardware keys, not pills. Comparisons are printed side-labels: 2px ink top rule, hairline row rules, small labels, right-aligned tabular prices.

STORY: The visitor understands in one glance that TopSoum compares Tunisianet, MyTek and Spacenet, types a model, and lands on one boxed answer with its price set large and a side-label of other resellers beneath.

FIRST VIEWPORT: Mobile 390px: shelf-gray ground; a white box face spanning the width (16px gutters) and most of the height. Inside, top: wordmark at start. Middle: headline "Le meilleur prix, sans faire le tour des boutiques." at 36px/500, tight tracking; one line naming the three resellers; a 56px search field with an attached accent "Chercher" key at its end. Bottom of the box: a printed side-label strip ("Comparé chez" + the three reseller names on hairline rules). Desktop: same box face, max 960px wide, headline 60px, generous inner padding. Popular searches sit below the box, beneath the fold.

FORM: La Boîte (the phone box: retail electronics packaging), my top-ranked grounded candidate (#1 of 7), chosen by the user as IMPECCABLE'S PICK over the assigned roll. Seed key 7b5cdf09.

Signature interaction: the suggestions tray slides out of the search field like a drawer from a box (clip-path + translate reveal, 200ms ease-out, instant under reduced motion).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved
- Dark mode remains undecided (light only).
- Barcode/EAN motif withheld: no EAN data exists; do not fabricate.
