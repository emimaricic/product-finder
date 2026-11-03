# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

B2B customers of a specialty chemicals company: formulators, R&D chemists and buyers at companies in personal care, home care, coatings, agriculture, food, pharma, textiles and plastics. They know chemistry (chemical names, functions such as surfactant/emulsifier, certifications such as RSPO, REACH, Halal). Their job: find raw materials that fit an application, narrow candidates by function, application area, region and certifications, compare a shortlist, and send a colleague a link to exactly what they are looking at. Often on a phone at a trade fair, also at a desk.

## Product Purpose

Product Finder lets customers explore the catalogue themselves instead of asking a sales contact who searches a spreadsheet. Success: a customer finds fitting, currently sellable products in a few taps, trusts the information is current, and can learn from other customers' reviews.

## Positioning

The source of truth is the nightly PIM export, so the finder only shows what is actually sold today, unlike old spreadsheets that still list discontinued products. Peer reviews from other customers sit next to the product data because customers trust each other more than marketing copy.

## Operating Context

- Mobile at trade fairs: one hand, possibly poor connectivity, quick lookups between conversations. Desktop for deeper comparison.
- Sharing: URLs carry the full search state (query, filters, sort, page) and product pages have stable SKU-based links.
- Data refreshes nightly from the PIM; the UI can show "data as of" from the last successful import.

## Capabilities and Constraints

- Search (substring across SKU, name, chemical name, function, area, description), filters: function, application area, region (a region filter also includes Global products), certifications (all selected must match), lifecycle status. Sort: name A–Z / Z–A, newest launch, top rated. Paginated.
- Lifecycle: Active, Phase-out (still sold, being retired), Discontinued (hidden by default, can be included). Products removed from the PIM export are "no longer offered": hidden from search, but old links still open the product page with a notice.
- Product page: all PIM fields (SKU, name, chemical name, function, application area, region, certifications, status, launch year, description) plus rating summary and reviews.
- Reviews: the only write flow. Anonymous (no authentication in this version): rating 1–5, display name, optional company, comment 10–2000 chars. Rate limited; public to everyone.
- Out of scope: auth, moderation, comments, sample requests, contact forms, e-mail.
- Stack (fixed by the brief): Angular (latest), TypeScript, SCSS, PrimeNG; NestJS + Prisma + PostgreSQL backend; Jest.
- UI language: English. Light + dark theme: follows the system, with a manual System/Light/Dark switch.

## Brand Commitments

- Name: "Product Finder" only. No company name, logo or brand mark may be invented.
- PrimeNG is mandatory; no second UI library. Theming goes through PrimeNG's structured tokens (primitive → semantic → component), the shadcn-style token discipline the user wants.
- Standing preference (user, 2026-11-03): contemporary premium product UI, not retro or print-artifact worlds. Craft bar set by Linear / Vercel, Apple / Raycast and Stripe. Must deliver a "wow" without reading as AI-generated. Light and dark themes following the system setting.

## Evidence on Hand

- `data/products.csv`: ~200 real catalogue rows (fictional product names, real chemistry terms). No product images, no logos, no testimonials. Reviews come only from users; demo reviews must not be presented as real customers.

## Product Principles

1. Current over complete: never present a product as available when it is not; lifecycle status is always visible.
2. The URL is the state: anything a customer sees can be shared as a link and reopened identically.
3. Expert density: show the facts specialists scan for (function, chemistry, certifications, region) without marketing padding.
4. Phone first: every task works one-handed on a small screen; desktop adds room, not features.
5. Honest peer voice: reviews are clearly from customers, never mixed with or imitated by company copy.

## Accessibility & Inclusion

WCAG 2.1 AA as baseline: keyboard reachable filters and forms, visible focus, sufficient contrast in sunlight-on-phone conditions, form errors announced and tied to fields.
