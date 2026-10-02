---
name: TopSoum
description: Comparateur de prix électronique tunisien. La réponse sur une face de boîte, la comparaison sur l'étiquette.
colors:
  ultramarine: "#3a5bff"
  ultramarine-pressed: "#2a47e0"
  on-ultramarine: "#ffffff"
  selection-wash: "#d9e0ff"
  ink: "#15171c"
  ink-raised: "#23262c"
  graphite: "#363a41"
  slate: "#4a4f57"
  muted: "#5f646d"
  dust: "#9aa0a9"
  edge-strong: "#cdd1d7"
  edge: "#e2e5e9"
  shelf: "#eef0f3"
  wash: "#f6f7f9"
  box-face: "#ffffff"
  savings-green: "#0f7a55"
  alert-red: "#d92d2d"
typography:
  display:
    fontFamily: "Readex Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.125rem, 6vw, 3.75rem)"
    fontWeight: 500
    lineHeight: 1.06
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Readex Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 4vw, 2.25rem)"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "-0.03em"
  price:
    fontFamily: "Readex Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "-0.03em"
    fontFeature: "tnum"
  title:
    fontFamily: "Readex Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 500
    lineHeight: 1.375
  section-title:
    fontFamily: "Readex Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.5
  body:
    fontFamily: "Readex Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: "Readex Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
  label:
    fontFamily: "Readex Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.33
rounded:
  key: "12px"
  card: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
  3xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.ultramarine}"
    textColor: "{colors.on-ultramarine}"
    typography: "{typography.body}"
    rounded: "{rounded.key}"
    padding: "0 20px"
    height: "52px"
  button-primary-hover:
    backgroundColor: "{colors.ultramarine-pressed}"
    textColor: "{colors.on-ultramarine}"
  button-secondary:
    backgroundColor: "{colors.box-face}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.key}"
    padding: "0 16px"
    height: "44px"
  button-secondary-hover:
    backgroundColor: "{colors.wash}"
    textColor: "{colors.ink}"
  search-key-compact:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.box-face}"
    rounded: "{rounded.key}"
    padding: "0 12px"
    height: "36px"
  search-key-compact-hover:
    backgroundColor: "{colors.ink-raised}"
  search-field:
    backgroundColor: "{colors.box-face}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.card}"
    padding: "6px"
  box-face:
    backgroundColor: "{colors.box-face}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "16px"
  best-deal-tab:
    backgroundColor: "{colors.ultramarine}"
    textColor: "{colors.on-ultramarine}"
    typography: "{typography.label}"
    rounded: "{rounded.key}"
    padding: "4px 12px 3px"
  chip-link:
    backgroundColor: "{colors.box-face}"
    textColor: "{colors.graphite}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.key}"
    padding: "0 16px"
    height: "44px"
  filter-count:
    backgroundColor: "{colors.ultramarine}"
    textColor: "{colors.on-ultramarine}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    height: "20px"
---

# Design System: TopSoum

## Overview

**Creative North Star: "La Boîte"**

TopSoum presents every product the way electronics arrive: a clean white box face carries the answer, and a printed side-label carries the comparison. Matte white faces (16px corners, a crisp 1px edge, never a shadow) sit on a cool shelf-gray ground. One electric ultramarine accent marks the single thing to do on a screen and the single best deal. Everything else is ink, muted gray and hairlines, the way a retail package is mostly white card and black print.

Density is calm and vertical: one column of faces, each holding one job (the answer, the price history, the other resellers, the specs, similar products). Comparisons never become grids of tiles; they become side-labels: a 2px ink rule across the top, hairline rules between rows, small muted column headers, prices right-aligned in tabular figures. Controls read as hardware keys: 12px-cornered rectangles that press in by 2% on tap, never pills.

The world is light only (dark mode is undecided). A barcode/EAN motif is deliberately withheld because the product has no EAN data; the packaging metaphor is carried by faces, edges, tabs and side-labels, not by fake packaging graphics.

**Key Characteristics:**
- Cool shelf-gray ground, matte white box faces, 1px edges, no resting shadows.
- One ultramarine accent, rationed to the screen's primary key and the "Meilleur prix" deal.
- Printed side-labels for every comparison: 2px ink top rule, hairline rows, tabular prices.
- Hardware-key controls: 12px corners, 44px minimum, 2% press.
- Readex Pro in two weights only, tight tracking on large type, tabular figures on every TND amount.

## Colors

A cool, cardboard-and-shelf neutral ramp printed in near-black ink, with one electric ultramarine and two semantic signals.

### Primary
- **Electric Ultramarine** (`ultramarine`): the one accent. Fills the home "Chercher" key, the "Voir l'offre" primary key, the "Meilleur prix" pull-tab and the 2px edge of the single best-deal face, the active-filter count, the keyboard focus ring, the text caret and native control `accent-color` (budget slider, price-tracking checkbox). On a crash screen whose only action is retry, it fills that one key.
- **Pressed Ultramarine** (`ultramarine-pressed`): hover state of an ultramarine key. Never a resting color.
- **On-Ultramarine White** (`on-ultramarine`): text and icons on ultramarine.
- **Selection Wash** (`selection-wash`): text selection background only, with ink text.

### Neutral
- **Ink** (`ink`): headings, product names, prices, the 2px side-label rule, the header search key, the price-history line, the offline banner ground, the favorited star.
- **Raised Ink** (`ink-raised`): hover of ink keys.
- **Graphite** (`graphite`): secondary text on the home "Comparatifs" links and filter labels.
- **Slate** (`slate`): supporting paragraphs on landing, 404 and favorites copy.
- **Muted** (`muted`): captions, "chez {vendeur}", side-label column headers, placeholders, chart axis ticks, resting icon color. The lowest text tone allowed on white.
- **Dust** (`dust`): hover borders only. Not a text color on white.
- **Field Edge** (`field`): the 1px border of text fields, selects and both search shells. At least 3:1 against white and shelf so a field is findable (WCAG 1.4.11).
- **Strong Edge** (`edge-strong`): borders of interactive keys (secondary key, filter key, header favorites key), scrollbar thumb.
- **Edge** (`edge`): the 1px edge of every box face, hairline row rules, chart grid, header bottom rule.
- **Shelf** (`shelf`): the page ground, the sticky header ground, browser theme color, skeleton fill.
- **Wash** (`wash`): row and key hover fill inside faces, chart skeleton.
- **Box Face** (`box-face`): every content surface.

### Semantic
- **Savings Green** (`savings-green`): only the "-X% vs moyenne" figure on the best deal.
- **Alert Red** (`alert-red`): inline mutation failures ("Échec, réessayer") and admin failure rates.

### Named Rules
**The One Ultramarine Rule.** Ultramarine marks the screen's one primary action and the one best deal, plus focus and native control accents. The price-history line, the header search key, secondary keys, result lists and similar products stay ink and gray. If two ultramarine fills compete on one viewport, one of them is wrong.

**The Printed Ink Rule.** Hierarchy comes from ink versus muted gray, never from extra hues. No second accent, no tinted panels.

## Typography

**Display Font:** Readex Pro (with ui-sans-serif, system-ui, sans-serif)
**Body Font:** Readex Pro
**Label Font:** Readex Pro

**Character:** One geometric-humanist family loaded at 400 and 500 only, chosen because it also covers Arabic for the future RTL version. Large type tightens to -0.03em so headlines and prices read like printed packaging; small type stays at natural tracking.

### Hierarchy
- **Display** (500, 34px mobile to 60px from 640px, line-height 1.08 to 1.04, -0.03em): the home headline only, balanced, max 16ch.
- **Headline** (500, 28px to 36px, 1.25, -0.03em): landing-page and 404 titles.
- **Price** (500, 40px, line-height 1, -0.03em, tabular): the best-deal amount, the largest number on any screen.
- **Title** (500, 18px, 1.375): product name on the best deal, search query heading, wordmark.
- **Section Title** (500, 16px): face titles ("Historique de prix", "Autres vendeurs", "Caractéristiques").
- **Body** (400, 16px, 1.5): intro paragraphs (max 46 to 60ch), search input (16px minimum so mobile browsers never zoom).
- **Body Small** (400 or 500, 14px): list rows, offer rows, keys, captions under titles.
- **Label** (400 or 500, 12px): side-label column headers, "Meilleur prix" tab, shipping and stock notes.

### Named Rules
**The Two Weights Rule.** 400 and 500 only. Emphasis comes from size, ink versus muted, and tracking, never from 600 or 700.

**The Tabular Price Rule.** Every TND amount, count and price range uses tabular figures so columns of prices align.

## Layout

Mobile-first single column. Inner pages (search, product, landing, favorites, 404) use a 768px max column with 16px side gutters, 16px top padding, 48px bottom padding, and 16px gaps between faces (20px from 640px). Faces pad 16px on mobile and 24px from 640px.

The home page is one box face filling the viewport height (100svh) inside a 12px shelf margin (24px from 640px), max 896px wide, with 20px inner padding on mobile and 48px from 640px. From 768px its content splits into the text-and-search column plus a 20rem device column. The "Comparatifs" links sit on the shelf beneath that face, below the fold.

Inner pages carry a sticky header on the shelf ground with a 1px bottom edge: wordmark at the start, compact search filling the middle, the favorites star key at the end. The home page has no header; its face is the header.

Rhythm runs on 4px steps, mostly 8, 12, 16 and 24. All direction-sensitive spacing uses logical properties (start/end, padding-inline-start) so the Arabic layout can mirror without rework. Breakpoints: 640px (padding and type step up), 768px (home two-column).

## Elevation & Depth

Flat by construction. Depth comes from material contrast (white face on gray shelf) and from edges: 1px edge on faces, 2px ink rule on side-labels, 2px ultramarine edge on the best deal. The one shadow in the system belongs to the suggestions tray, which floats above content while the search field is open.

### Shadow Vocabulary
- **Tray float** (`box-shadow: 0 12px 32px -12px rgba(21,23,28,0.18)`): the search suggestions tray only.

### Named Rules
**The Box Face Rule.** Every content block is a white face with a 16px corner and a 1px edge on the shelf. Faces never carry a shadow; only the floating suggestions tray does.

## Shapes

Two radii do all the work: 16px for faces (cards, panels, search field shell, suggestion tray, filter drawer) and 12px for keys (buttons, links styled as keys, selects, thumbnails, row hover fills). The "Meilleur prix" tab rounds only its top corners (12px) and hangs 13px above the best-deal edge like a packaging pull-tab. Full rounding is reserved for the active-filter count badge and skeleton text lines; no control is a pill.

Icons are a single in-house outline family: 24px grid, 1.75 stroke, round caps and joins, used at 18 to 22px. The star fills with ink only to show a favorited state. The wordmark pairs an outline box glyph with "TopSoum" in 500.

## Components

### Buttons
Hardware keys: firm rectangles that press in.
- **Shape:** 12px corners; 44px minimum height and width (52px for the large primary).
- **Primary:** ultramarine fill, white 500 text, 0 20px (large) or 0 16px (default). One per screen: "Voir l'offre" on the best deal, "Chercher" on home.
- **Hover / Focus / Active:** hover deepens to pressed ultramarine; focus shows the global 2px ultramarine ring offset 2px; tap scales to 0.98 over 150ms. Disabled drops to 50% opacity and ignores pointer.
- **Secondary:** white face, strong-edge 1px border, ink 500 text; hover moves the border to dust and the fill to wash. Used for per-row "Voir l'offre", "Afficher plus", "Retour à l'accueil", the filter key.

### Search
- **Hero (home):** a 16px-cornered white shell with a field-edge border and 6px inner padding, a 22px outline search icon, a 48px input at 16 to 18px, and an attached ultramarine "Chercher" key at the end.
- **Compact (header):** same shell with a field-edge border, 4px inner padding, 44px input, and a 44px ink icon key (never ultramarine, so it never competes with "Voir l'offre").
- **Focus:** the shell border turns ultramarine (focus-within) and the shell carries the global 2px ultramarine ring while the input has focus.
- **Keyboard:** the field is a combobox: arrow keys move through suggestions, Enter opens the highlighted one, Escape closes the tray.
- **Suggestions tray:** a white 16px face 8px below the field, sliding out like a drawer from a box: clip-path plus 6px translate reveal, 200ms cubic-bezier(0.22, 1, 0.36, 1), instant under reduced motion. Rows are 44px with name at start and tabular price at end.

### Cards / Containers
- **Corner Style:** 16px.
- **Background:** box face white on the shelf.
- **Shadow Strategy:** none (see Elevation).
- **Border:** 1px edge.
- **Internal Padding:** 16px mobile, 24px from 640px; titled faces put a 16px section title above their content with 12px spacing.

### Best Deal (signature)
The answer, boxed. A face with a 2px ultramarine edge (the only accent edge in the product), the "Meilleur prix" pull-tab hanging from its top edge at the start, a contained product photo (192px, 224px from 640px), product title and "chez {vendeur}" in muted, a hairline rule, the 40px tabular price with "-X% vs moyenne" in savings green beside it, then the full-width large primary key "Voir l'offre" with an outline up-right arrow. When the score picked this offer over a cheaper one (out of stock, unconfirmed stock, shipping, lower-rated reseller), one muted line under the price names the cheaper offer and the reason; the badge never hides a lower price. There is at most one per screen.

### Side-Label (signature)
Every comparison reads as a printed label: 2px ink rule on top, 12px muted column headers ("Revendeur" / "Prix"), hairline rows of at least 44px, vendor name in ink 500 at start, tabular price right-aligned at end. Used for other resellers, the spec sheet, similar products and the home "Comparé chez" strip. Unknown prices read "Prix en cours de mise à jour" in muted, never 0 TND.

### Lists
Result rows: 56px thumbnail with 12px corners, two-line name in body-small ink, vendor count in label muted, tabular price at end; hairline dividers; the whole row is a link with a wash hover. Similar products: two columns on mobile, four from 640px, under a side-label rule. Neither ever carries ultramarine.

### Chips
- **Style:** the home "Comparatifs" links are white keys (12px, 44px tall, edge border, graphite 14px text) on the shelf; hover strengthens the border and the text to ink.

### Inputs / Fields
- **Style:** selects and fields are white with a field-edge 1px border, 12px corners, 44px tall.
- **Native controls:** range slider and checkbox take ultramarine through `accent-color`.
- **Focus:** global 2px ultramarine outline, 2px offset.

### Filters
Collapsed by default behind one secondary key ("Filtres" with an outline sliders icon). When filters are active, a 20px round ultramarine count badge sits in the key. The panel opens as a full-width face below with the same drawer reveal as the suggestions tray.

### Navigation
Sticky header on the shelf with a 1px bottom edge, wordmark (outline box glyph plus "TopSoum", 18px, 500, -0.03em), compact search (below 420px the wordmark shows its glyph only, the name stays as the link's accessible label), and one 44px outline star key (secondary style, never ultramarine) to the favorites, which leads through the French sign-in page when needed. No other nav links, no menu.

### States
Loading uses skeleton blocks and lines in shelf gray with the face's own shape (12px blocks, round text lines). Empty states are a white face with a centered ink line and a muted suggestion. Offline shows a sticky ink banner with white text and the recently viewed products as underlined links.

### Price History
A Recharts step line in ink at 2px, no dots, edge-colored grid and cursor, muted axis ticks. Single-price products show a sentence summary instead of a flat line.

## Do's and Don'ts

### Do:
- **Do** put every content block on a white face (16px corners, 1px edge) over the shelf gray.
- **Do** open every comparison with the 2px ink rule and separate rows with hairlines, prices right-aligned in tabular figures.
- **Do** keep ultramarine to the screen's single primary key, the single best deal (tab plus 2px edge), the active-filter count, focus and native control accents.
- **Do** make every control a 12px-cornered key at least 44 by 44px that scales to 0.98 on tap.
- **Do** set every TND amount in tabular figures.
- **Do** use logical properties (start/end) for all direction-sensitive spacing and alignment.
- **Do** honor reduced motion: the tray and filter drawer appear instantly.

### Don't:
- **Don't** draw the price-history line, the header search key, result rows or similar products in ultramarine.
- **Don't** add a second accent hue or tinted panels; savings green and alert red are signals, not decoration.
- **Don't** use weights other than 400 and 500, or a second typeface.
- **Don't** put shadows on box faces; the suggestions tray is the only floating element.
- **Don't** shape controls as pills.
- **Don't** set text in dust on white; muted is the lightest text tone.
- **Don't** fabricate a barcode or EAN motif; the product has no EAN data.
- **Don't** introduce dark-mode values until dark mode is decided.
- **Don't** add uppercase kickers or eyebrow labels above headings.
