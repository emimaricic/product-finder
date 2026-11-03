---
name: Product Finder
description: Precision Catalogue. A dense, keyboard-fast ingredient finder on PrimeNG (Aura, re-tokened), light and dark following the OS, with a System/Light/Dark switch.
colors:
  page: "#fafafa"
  background: "#ffffff"
  foreground: "#09090b"
  muted: "#f4f4f5"
  muted-foreground: "#52525b"
  subtle-foreground: "#71717a"
  border: "#e4e4e7"
  border-strong: "#d4d4d8"
  primary: "#09090b"
  primary-foreground: "#fafafa"
  ring: "#6366f1"
  ring-soft: "rgb(99 102 241 / 0.18)"
  selected: "#eef2ff"
  star: "#09090b"
  star-empty: "#d4d4d8"
  status-active: "#047857"
  status-active-bg: "#ecfdf5"
  status-phase-out: "#b45309"
  status-phase-out-bg: "#fffbeb"
  status-discontinued: "#52525b"
  status-discontinued-bg: "#f4f4f5"
  status-delisted: "#be123c"
  status-delisted-bg: "#fff1f2"
  destructive: "#dc2626"
  destructive-foreground: "#b91c1c"
  destructive-bg: "#fef2f2"
  header-bg: "rgb(255 255 255 / 0.8)"
  dark-page: "#09090b"
  dark-background: "#111113"
  dark-foreground: "#fafafa"
  dark-muted: "#1c1c20"
  dark-muted-foreground: "#a1a1aa"
  dark-subtle-foreground: "#8b8b94"
  dark-border: "#26262b"
  dark-border-strong: "#3a3a41"
  dark-primary: "#fafafa"
  dark-primary-foreground: "#09090b"
  dark-ring: "#818cf8"
  dark-ring-soft: "rgb(129 140 248 / 0.25)"
  dark-selected: "rgb(129 140 248 / 0.12)"
  dark-star: "#fafafa"
  dark-star-empty: "#3f3f46"
  dark-status-active: "#34d399"
  dark-status-active-bg: "rgb(52 211 153 / 0.1)"
  dark-status-phase-out: "#fbbf24"
  dark-status-phase-out-bg: "rgb(251 191 36 / 0.1)"
  dark-status-discontinued: "#a1a1aa"
  dark-status-discontinued-bg: "rgb(161 161 170 / 0.12)"
  dark-status-delisted: "#fb7185"
  dark-status-delisted-bg: "rgb(251 113 133 / 0.1)"
  dark-destructive: "#f87171"
  dark-destructive-foreground: "#fca5a5"
  dark-destructive-bg: "rgb(248 113 113 / 0.1)"
  dark-header-bg: "rgb(9 9 11 / 0.72)"
  fn-sf-a: "#38bdf8"
  fn-sf-b: "#2563eb"
  fn-ef-a: "#a78bfa"
  fn-ef-b: "#7c3aed"
  fn-em-a: "#fdba74"
  fn-em-b: "#ea580c"
  fn-po-a: "#5eead4"
  fn-po-b: "#0f766e"
  fn-pr-a: "#f0abfc"
  fn-pr-b: "#a21caf"
  fn-rm-a: "#bef264"
  fn-rm-b: "#4d7c0f"
  fn-ao-a: "#f9a8d4"
  fn-ao-b: "#db2777"
  fn-sv-a: "#cbd5e1"
  fn-sv-b: "#475569"
  fn-xx-a: "#d4d4d8"
  fn-xx-b: "#52525b"
typography:
  display:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "-0.02em"
  title-row:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "-0.015em"
  body-long:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "-0.005em"
  body:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "'ss01', 'cv11'"
  label:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.25
  mono:
    fontFamily: "Geist Mono Variable, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    letterSpacing: "-0.01em"
  mono-code:
    fontFamily: "Geist Mono Variable, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1
rounded:
  xs: "4px"
  sm: "6px"
  md: "10px"
  input: "12px"
  lg: "14px"
  glyph-lg: "16px"
  pill: "999px"
spacing:
  hair: "1px"
  "1": "0.25rem"
  "2": "0.5rem"
  "3": "0.75rem"
  "3.5": "0.875rem"
  "4": "1rem"
  "5": "1.25rem"
  "6": "1.5rem"
  "8": "2rem"
  gutter: "1rem"
  gutter-md: "1.5rem"
  header-h: "3.5rem"
  sidebar: "16rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.sm}"
    padding: "0.5rem 1rem"
  button-primary-dark:
    backgroundColor: "{colors.dark-primary}"
    textColor: "{colors.dark-primary-foreground}"
    rounded: "{rounded.sm}"
    padding: "0.5rem 1rem"
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.sm}"
    padding: "0.5rem 1rem"
  search-input:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.input}"
    height: "3rem"
    padding: "0 0.75rem 0 2.75rem"
  function-glyph:
    textColor: "#ffffff"
    typography: "{typography.title-row}"
    rounded: "{rounded.md}"
    size: "2.5rem"
  function-glyph-lg:
    textColor: "#ffffff"
    rounded: "{rounded.glyph-lg}"
    size: "4rem"
  status-badge:
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0.0625rem 0.5rem"
  cert-chip:
    backgroundColor: "{colors.background}"
    textColor: "{colors.muted-foreground}"
    rounded: "{rounded.pill}"
    padding: "0 0.4375rem"
  filter-chip:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    height: "1.75rem"
    padding: "0 0.625rem"
  product-row:
    padding: "0.875rem 1rem"
  product-row-hover:
    backgroundColor: "{colors.muted}"
  product-row-selected:
    backgroundColor: "{colors.selected}"
  product-sheet:
    backgroundColor: "{colors.background}"
    rounded: "{rounded.lg}"
    padding: "2rem 2.25rem 2.25rem"
  spec-cell:
    backgroundColor: "{colors.background}"
    padding: "0.75rem 0.875rem"
  kbd:
    backgroundColor: "{colors.background}"
    textColor: "{colors.muted-foreground}"
    rounded: "5px"
    height: "1.25rem"
---

# Design System: Product Finder

## Overview

**Creative North Star: "The Precision Catalogue"**

The category standard executed at the craft level of Linear, Vercel, Raycast and Stripe. A neutral zinc ground with crisp 1px hairlines and soft layered shadows carries dense expert data; the wow comes from exact Geist type, a colour system where every hue has one job, and motion that explains navigation (the function glyph flies from the result row into the product header). It refuses both the bland zinc-on-white dashboard and retro or print costumes.

Two schemes, one system: light (white panels on a zinc-50 page) and dark (#111113 panels on near-black #09090b), following `prefers-color-scheme` by default, overridable with the header's System/Light/Dark switch (`data-theme` on `<html>`, remembered in localStorage, applied before first paint). Every scheme-dependent value is declared twice in `styles.scss` and mirrored with `light-dark()` in the PrimeNG preset. Primary actions are ink: black in light, white in dark.

Density is expert-grade: 14px body, rows that scan as a table from 1100px, facts before prose. Phone first; desktop adds columns and keyboard affordances, not features.

**Key Characteristics:**
- Neutral ground, hairline borders, soft ambient shadows; colour reserved for four jobs.
- Eight function hues, each a two-stop gradient, rendered as a small rounded glyph tile.
- Ink primary, indigo focus and keyboard selection, amber/zinc/rose lifecycle.
- Geist + Geist Mono; tight negative tracking on headings; tabular numerals for counts.
- Keyboard-first browsing (/, ↑ ↓, Enter, Esc) and a 320ms View Transition glyph morph.
- The URL is the state; every view is shareable.

## Colors

A zinc neutral system with exactly four colour jobs; a hue that is not doing one of them does not appear. Frontmatter carries both schemes: unprefixed keys are light, `dark-*` keys are the `prefers-color-scheme: dark` overrides of the same CSS custom property (`--page`, `--foreground`, ...).

### Primary
- **Ink** (`primary` / `dark-primary`): primary buttons ("Write a review", "Publish review", drawer "Show N results"), selected paginator page, filled stars and rating bars (`star`). Black on light, white on dark; hover steps one zinc stop toward the middle (zinc-800 / zinc-200).

### Secondary
- **Indigo Ring** (`ring`, `ring-soft`, `selected`; indigo-500 / indigo-400 in dark): focus and keyboard selection, nothing else. 2px outline at 2px offset globally; on form fields a 4px soft halo replaces the outline; a keyboard-focused result row gets the `selected` tint plus a 1px inset ring; the filter chip hover border; text selection. PrimeNG `highlight` (indigo-50/700 light, indigo-400 at 15% / indigo-200 dark) is the same job.

### Tertiary
- **Function Hues** (`fn-*-a` → `fn-*-b`, gradient at 145deg on tiles, 90deg on bars): Surfactant SF sky→blue, Emulsifier EF violet, Emollient EM orange, Polymer PO teal, Preservative PR fuchsia, Rheology modifier RM lime, Antioxidant AO pink, Solvent SV slate; `fn-xx` zinc for any unmapped function. Scheme-independent. Used on the function glyph, the function spectrum bars, and the product sheet's corner glow and top hairline.
- **Lifecycle** (`status-*` + `status-*-bg`): Active emerald, Phase-out amber, Discontinued zinc, No longer offered rose. Used only in the status badge and the product notice. Dark scheme swaps to the 400 stops on 10-12% tinted grounds.
- **Destructive** (`destructive*`): form validation and server errors only.

### Neutral
- **Page** (`page`): the canvas behind panels; zinc-50 / #09090b.
- **Panel** (`background`): results panel, product sheet, reviews, inputs; white / #111113.
- **Muted Wash** (`muted`): row hover, filter chips, skeletons, empty-state icon tiles.
- **Text ramp** (`foreground` > `muted-foreground` > `subtle-foreground`): values, then labels and secondary facts, then SKU codes, counts and hints.
- **Hairline** (`border`, `border-strong`): every divider, panel edge and chip outline; `border-strong` for scrollbars.
- **Translucent Header** (`header-bg`): 80% white / 72% near-black under an 14px backdrop blur.

### Named Rules
**The Four Jobs Rule.** Colour means function (hues), lifecycle (status), focus/selection (indigo) or ink action. Nothing else is coloured: no tinted section backgrounds, no coloured headings, no decorative accents. The live-data pulse in the header is deliberately neutral ink.

**The One Glow Rule.** The function hue spreads beyond its glyph in exactly one place: the product sheet's top-left radial glow (`--glow-strength` 16% light, 26% dark) and its 1px top hairline.

**The Lifecycle Once Rule.** Lifecycle is shown once per viewport. Result rows omit the badge for Active products; the product header drops its badge when a lifecycle notice is shown.

## Typography

**Display Font:** Geist Variable (with ui-sans-serif, system-ui, -apple-system, Segoe UI)
**Body Font:** Geist Variable
**Label/Mono Font:** Geist Mono Variable (with ui-monospace, SFMono-Regular, Menlo)

**Character:** One neutral grotesque at precise weights with tight negative tracking on anything 15px and up; mono marks machine identifiers (SKU, function codes, kbd). Body runs `font-feature-settings: 'ss01', 'cv11'`, antialiased; headings `text-wrap: balance`, paragraphs `pretty`. Fixed rem scale (ratio ~1.125, `--text-xs` 0.75 to `--text-3xl` 2rem), no fluid type.

### Hierarchy
- **Display** (600, 1.625rem phone → 2.25rem ≥768px, 1.15, -0.035em): product name in the sheet header.
- **Headline** (600, 1.375rem → 1.625rem ≥640 → 1.875rem ≥1024, 1.2, -0.03em): catalogue page title.
- **Title** (600, 1.125rem): section headings (Customer reviews, empty/error states).
- **Row title** (600, 0.9375rem, 1.35, -0.015em): product name in a result row; also the wordmark (0.9375rem, -0.025em).
- **Body long** (400, 1.0625rem, 1.6, max 62ch): product description; review comments use body at 1.6 and 65ch.
- **Body** (400, 0.875rem, 1.5): default UI text, spec values (500), filter options.
- **Label** (500, 0.75rem): status badges, chips, spec `dt`, hints, counts, dates.
- **Mono** (0.8125rem, -0.01em): SKU; **Mono code** (600, 0.6875rem): spectrum segment codes and kbd.
- **Numerals**: rating average 2.25rem / 600 / -0.03em; all counts `tabular-nums`.
- **Inputs**: ≥1rem on every text field (no iOS zoom); search 1rem → 1.0625rem ≥1024px.

### Named Rules
**The No Eyebrow Rule.** Headings stand alone. No small uppercase kicker or eyebrow label above a title; the SKU above the product name is data in mono, not a label.

## Layout

Max content width 82rem (header and catalogue), 56rem for the product page. Horizontal gutter `--gutter` 1rem, 1.5rem from 768px. Spacing runs on a 4px base (0.25 / 0.5 / 0.75 / 0.875 / 1 / 1.25 / 1.5 / 2rem); 0.875rem is the row and cell padding signature.

**Breakpoints** (min-width): 640px, 768px, 1024px, 1100px; plus `(pointer: coarse)` / `(pointer: fine)` for kbd hints and touch-target height.
- **Phone (<640):** header, intro band (title + live count, 48px search, function spectrum), then results flush to the edges with a sticky toolbar: Filters · icon Share · Sort, with the count shown in the intro. Filters open in a bottom drawer (88dvh, 16px top corners, footer: Clear all + ink "Show N results").
- **≥640:** toolbar on one row, count inline (stays visible after the intro scrolls), labelled "Share search", sort fixed 9.5rem. Review form name/company go two-up.
- **≥768:** gutter 1.5rem; product sheet header puts actions on the right; spec grid goes 4 columns.
- **≥1024:** two columns: 16rem filter sidebar + results panel (2rem gap). The results panel becomes a bordered, rounded (14px), shadowed card; the Filters button hides and the kbd legend appears. Search grows to 52px.
- **≥1100:** product rows switch to a fixed column table (see Components).

Sticky layers: header 3.5rem at z 20; results toolbar sticks under it at z 5. Both translucent with backdrop blur.

## Elevation & Depth

Mostly flat with tonal layering (page → panel) and hairline borders; shadows are soft and ambient, never structural. Dark scheme deepens shadow alpha and adds a 2% white edge so panels separate from near-black.

### Shadow Vocabulary
- **xs** (light `0 1px 2px 0 rgb(0 0 0 / 0.04)`; dark `0 1px 2px 0 rgb(0 0 0 / 0.4)`): reviews panel, form fields.
- **sm** (light `0 1px 2px rgb(0 0 0 / 0.04), 0 2px 8px -2px rgb(0 0 0 / 0.06)`; dark `0 1px 2px rgb(0 0 0 / 0.4), 0 0 0 1px rgb(255 255 255 / 0.02)`): results panel, product sheet, search field.
- **md** (light `0 1px 2px rgb(0 0 0 / 0.04), 0 8px 24px -6px rgb(0 0 0 / 0.1)`; dark `0 8px 30px -8px rgb(0 0 0 / 0.6)`): reserved for raised surfaces.
- **Overlay** (`0 12px 32px -8px rgb(0 0 0 / 0.18)`): PrimeNG select and popover panels.
- **Translucency** (`saturate(1.6) blur(14px)` header, `saturate(1.5) blur(12px)` toolbar at 86% panel): content reads as passing beneath.

### Named Rules
**The No Nesting Rule.** One card level only. Inside a panel, structure comes from hairlines (row dividers, spec-grid gaps, review list borders), never a second bordered, shadowed card.

## Shapes

Gently rounded, consistent by size: 4px checkbox, 5px kbd, 6px buttons, list options and clear buttons, 10px glyph tile, notice, spec grid and reviews panel, 12px search field and state-icon tile, 14px results panel and product sheet, 16px large glyph and drawer top. Badges, chips, cert chips, spectrum bars, rating bars and the header freshness pill are full pills (999px). Borders are always 1px hairlines; the dashed hairline marks an overflow "+N" chip.

## Components

### Function Glyph (signature)
Square gradient tile carrying the two-letter function code in white Geist 600, -0.03em. 2.5rem / 10px radius / 0.875rem text in rows; 4rem / 16px / 1.375rem in the product header. `linear-gradient(145deg, a, b)`, flat: no bevel, inner highlight, border or drop shadow. Has `view-transition-name: glyph-<sku>` in both places so it morphs on navigation. `aria-hidden`; the function name is always in text nearby.

### Function Spectrum
A clickable proportional bar under the search: one segment per function, `flex-grow` = product count, 3px gaps, 6px pill bar in the hue gradient (90deg) above a mono code. Hover/focus scales the bar 1.6x vertically; selected adds a 2px panel-colour gap and a 1.5px ring in the segment's `b` hue; unselected segments dim the bar (not the label) to 0.3 when a function is selected, and segments with no matches are always dimmed. Widths are cross-filtered counts (every other active filter applied), so selecting a function never resizes the bar. A caption line always says what the widths mean and, on hover or selection, names the function with its count ("Showing Polymer · 25 of 169 products").

### Toolbar
Sticky, translucent, hairline below. Filters (outlined, with count) · count · kbd legend (≥1024) · Share · Sort select. Active filters render as removable pill chips (muted wash, hairline, ring-coloured border on hover) with a text "Clear all"; the chip row scrolls horizontally on phones.

### Product Row
Whole-row link, 0.875rem × gutter padding, hairline between rows. Phone grid: glyph | name + status + (mono SKU, chemical name truncated) | rating, then function · area · region, then up to two cert chips +N. **≥1100px**: one line of fixed columns `auto | 1.4fr | 1.3fr | 1.1fr | 6.5rem | 1rem` = glyph, name/chem, function over area·region, one cert chip +N, rating (or "No reviews"), arrow. Hover: muted wash and the arrow slides in (4px, 150ms). Keyboard focus: `selected` tint, 1px inset ring, arrow turns indigo. Status badge only for non-Active products.

### Status Badge
Pill, label type, colour from the lifecycle token, background from its `-bg`, 1px inset ring of the colour at 18%, a 6px leading dot. Same words everywhere: Active, Phase-out, Discontinued, No longer offered.

### Certification Chips
Hairline pills on the panel colour. Rows: 0.6875rem / 500 / 1.25rem line, muted text, dashed "+N" overflow. Spec grid: 0.75rem, foreground text, 1.5rem line, all certifications listed.

### Product Sheet
Single card, max 56rem: 1.25rem padding (2rem 2.25rem 2.25rem ≥768), 14px radius, shadow sm, with the function glow `radial-gradient(120% 70% at 0% 0%, hue-a @ glow-strength, transparent 60%)` and a 1px top hairline fading from the hue at 0.8 opacity. Header: large glyph, mono SKU, display name, chemical name in muted base size; Share and (when no notice) status badge on the right. A "Back to results" link above returns to the last search's query params.

### Notice
For Phase-out, Discontinued and No longer offered: lifecycle `-bg` ground, 1px border of the lifecycle colour at 28%, 10px radius, info icon and bold title in the lifecycle colour, body in foreground.

### Spec Grid
Datasheet of hairline cells: the grid's own background is `border` with 1px gaps, cells on panel colour, 10px outer radius. 2 columns, 4 at ≥768; certifications span 2. Label (`dt`) over value (`dd`, 500).

### Reviews
A sibling card (10px radius, shadow xs) below the sheet, not inside it. Head: title + ink "Write a review". Summary: 2.25rem average, large stars, count; distribution bars in ink on a muted pill track. List: stars + date, comment (65ch, 1.6), author 600 with company muted. Stars are ink, empty stars zinc-300 / zinc-700.

### Review Form
Inline between hairlines inside the reviews card. PrimeNG Rating (1.75rem stars, ink active), inputs ≥1rem with indigo soft halo on focus; invalid fields get a destructive border and 3px destructive halo, error text 0.75rem / 500 below, tied by `aria-describedby`. Server errors in a destructive-tinted bar. Actions right: text Cancel, ink "Publish review".

### Filter Panel and Drawer
Sidebar ≥1024, bottom drawer below. "Include discontinued" toggle first, then fieldsets (Function, Application area, Region, Certification) with 600 legends, hairline separators, checkbox rows with tabular counts; rows 2.25rem tall on coarse pointers, 1.875rem on fine, muted wash on hover.

### Buttons, Inputs, kbd
PrimeNG buttons at 0.5rem × 1rem, label 500: ink primary, outlined secondary (hairline, muted hover), text secondary. Inputs: hairline border, xs shadow, indigo-400 focus border plus soft halo. `kbd`: 1.25rem mono key on panel colour, hairline with a 2px bottom edge, 5px radius; hidden on coarse pointers.

### Header
Sticky translucent bar: text wordmark "Product Finder" (600, -0.025em), a hairline pill "Synced with PIM · date" with a neutral pinging dot (the date of the last import that changed data; hidden below 420px), and the three-way theme switch (System · Light · Dark, icon-only, pill segmented control).

### Interaction
- **URL state:** query, filters, sort and page live in query params; search debounced 300ms; product URLs are SKU-based.
- **Share:** native share sheet on coarse pointers, else copy to clipboard with "Link copied" for 2s and a polite live region.
- **Keyboard:** `/` focuses search; ↓ moves from search into rows, ↑/↓ walk rows (↑ from the first row returns to search); Enter opens; Esc from a row returns to search, in search clears it.
- **Motion:** View Transitions on route change (initial skipped); groups run 320ms on `cubic-bezier(0.22, 1, 0.36, 1)`, root cross-fade 180ms. State transitions 150ms (PrimeNG `transitionDuration` matches); spectrum 200ms; reload dims the list to 0.55. `prefers-reduced-motion` collapses all animation and view transitions to 0.01ms.

### PrimeNG Token Layering
`FinderPreset` extends Aura in three layers. **Primitive:** radii xs 4 / sm 6 / md 10 / lg 12 / xl 14. **Semantic:** primary mapped to zinc with ink `color` `light-dark(zinc.950, zinc.50)`; surface 900/950 = #111113 / #09090b; text, highlight (indigo), focusRing (2px indigo-500 / 400), content, formField (soft halo instead of outline), overlay all written with `light-dark()`. **Component:** button padding and outlined/text secondary, paginator (ink selected page), checkbox radius, drawer border, rating icon. Change values in both `styles.scss` and the preset; they mirror each other.

## Do's and Don'ts

### Do:
- **Do** declare every scheme-dependent value twice (`:root` and the dark media query) and mirror it in `FinderPreset` with `light-dark()`.
- **Do** use the function hue tokens only through the glyph, the spectrum and the product sheet glow.
- **Do** show lifecycle once per viewport, with the same words and colours everywhere.
- **Do** use indigo only for focus and keyboard selection, and ink for the one primary action in a region.
- **Do** separate content inside a card with 1px hairlines.
- **Do** keep every view reproducible from its URL and give it a Share affordance.
- **Do** honour `prefers-reduced-motion` for every new animation and transition name.

### Don't:
- **Don't** add eyebrow or kicker labels above headings.
- **Don't** nest a bordered or shadowed card inside another card.
- **Don't** invent a logo, mark or company name; the wordmark is the text "Product Finder".
- **Don't** add bevels, inner highlights, borders or drop shadows to function glyphs.
- **Don't** use colour outside its four jobs: no coloured section fills, headings or decorative accents.
- **Don't** use a status colour for anything that is not lifecycle (the live-data pulse stays ink).
- **Don't** add a light-only or dark-only value: every scheme-dependent token needs both values, because the user can force either scheme with the theme switch.
