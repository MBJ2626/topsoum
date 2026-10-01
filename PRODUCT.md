# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

Mobile-first responsive web app, installable as a PWA. No native app in V1.

## Users

**Primary: the mobile price-checker.** A Tunisian buyer on an entry/mid-range Android phone, often on 4G or a degraded connection, who already knows the model they want ("iPhone 15 prix", "pc portable pas cher") and usually arrives from Google. Their job: find the lowest trustworthy price for that exact product, across Tunisian resellers, in a few seconds, and go buy it.

Secondary (served, not designed for first): the researching buyer who follows a few products over days through favorites, manual price tracking and price-history curves.

Admin: the single owner, who monitors scraper health and approves or rejects low-confidence product matches.

## Product Purpose

TopSoum (topsoum.com) finds electronics prices (smartphones, laptops, desktops/components, TVs, receivers) across Tunisian resellers, matches the same product across sites, and puts the best deal first. Success means answering "where is it cheapest right now, and can I trust that price?" faster than opening the reseller sites by hand, and ranking on Google for "meilleur prix {produit} Tunisie" queries.

## Positioning

The only serious local comparator for the Tunisian electronics market. Nothing like idealo or Google Shopping covers it. The edge comes from cross-site product matching for Tunisian listings, TND price history, and a "best deal" score that weighs price, vendor trust and shipping, rather than only listing the lowest number.

## Operating Context

- Search-first: most sessions start with a typed or Google-landed query for a specific model, not with browsing categories.
- Data comes from scrapers run 2–3 times a day (Tunisianet, MyTek, Spacenet in the MVP). Prices can go stale or look wrong, and scraping can fail per vendor.
- The visitor leaves the site to buy: an offer click is a tracked outbound redirect to the reseller.
- Network reality: slow or unstable mobile connections, offline moments, low-end devices.

## Capabilities and Constraints

- V1: multi-vendor comparison with best deal, price history chart, accounts (email/password plus Google/Facebook OAuth via NextAuth), favorites with a **manual** `price_tracking` toggle per product (never automatic), and a mono-admin dashboard (`is_admin` boolean, no roles).
- SEO landing pages per popular query (`/meilleur-prix/{slug}`), plus a sitemap, JSON-LD Product/Offer in TND, and Open Graph.
- Not in V1: price alerts (email/SMS), informal market (Facebook Marketplace/WhatsApp), sponsored placement (explicitly deferred to later versions), native app.
- Every API call must handle loading, error and success. A doubtful or missing price is never shown as a number. It reads "Prix en cours de mise à jour" instead.
- Targets: TTI under 3 s on Tunisian 4G, Lighthouse mobile above 90, 44 px minimum touch targets.
- Terminology: "Meilleur prix" (best-deal badge), "Voir l'offre" (outbound CTA), "suivi de prix" (price tracking), prices in TND.
- Undecided: affiliation deals with resellers (planned business model, no confirmed partnership yet), the "prix officiel importateur vs revendeur indépendant" tag.

## Brand Commitments

- Name **TopSoum**, domain **topsoum.com**, interface in French (`fr`, Open Graph locale `fr_TN`).
- Arabic is planned for later. Layouts must stay RTL-ready (logical properties, no direction-baked layouts) so Arabic can ship without a redesign.
- Design principles validated by the owner (docs/PROJET.md §2.3, §5) and binding: search-first homepage with a single action; best deal shown large, alternatives in a discreet list; filters hidden behind one button and collapsed by default; one dominant CTA per screen; neutral palette with a **single accent** reserved for the primary action and the "Meilleur prix" badge; one typeface family, two weights (400/500); outline icons only; fine borders, soft radii (current values in DESIGN.md); "-X% vs moyenne" shown in green on the best deal.
- Update 2026-10-01 (user decision): the one-accent and one-family/two-weights discipline stays, but the accent color and the typeface are no longer pinned to blue and the system font. The current values live in DESIGN.md.

## Evidence on Hand

- Working scrapers for Tunisianet, MyTek and Spacenet (`apps/scrapers/vendors/`), feeding real offers and price history.
- Product spec and decision log: `docs/PROJET.md`.
- App icon `apps/web/public/icon.svg`, PWA manifest and offline page.
- None yet: vendor logos, user testimonials, traffic figures, press, or confirmed affiliate partnerships. Do not fabricate any of these.

## Product Principles

1. **Answer, don't browse.** One query should give one dominant answer: the best deal for that exact product.
2. **Trust over cheapness.** A price we can't stand behind gets flagged, never displayed silently. Vendor trust and shipping count toward "best".
3. **Built for the real Tunisian phone.** Low-end Android on a shaky 4G connection is the baseline. Speed, skeletons, retry and offline handling are part of the product.
4. **Restraint is the differentiator.** Competitors are overloaded, so each screen gets one action, one accent and minimal visible chrome.
5. **The user stays in control.** Tracking is opt-in per product, there are no sponsored results, and nothing gets pushed at the user.

## Accessibility & Inclusion

- 44×44 px minimum touch targets, momentum scrolling, safe-area insets.
- Correct `inputmode`/`type="search"` on inputs. Readable on small, low-DPI screens.
- RTL-readiness for the future Arabic version.
