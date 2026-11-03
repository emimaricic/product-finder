# Decisions

## 1. Architecture

Quality gates: CI (`.github/workflows/ci.yml`) runs lint, unit and e2e tests (against a real Postgres), builds both apps, then boots the whole Docker stack from an empty database. It smoke-tests the stack through nginx and checks that the seed is idempotent across restarts.


```
Browser (phone / desktop)
   │  same origin: /         → Angular SPA (nginx)
   │               /api/*    → reverse proxy
   ▼
NestJS API ── products (search, facets, detail)
   │        ── reviews (list, create: the only write flow)
   │        ── health
   ▼
PostgreSQL ← Prisma migrations
   ▲
CLI import (same code path as the seed) ← data/products.csv (nightly PIM export)
```

- **One repository** with `backend/` and `frontend/`, plus a root `docker-compose.yml` that runs postgres, api and web. Reviewers clone one thing and run one command.
- **Same-origin API.** nginx (Docker) and the Angular dev proxy (local) both forward `/api`. The app needs no CORS, there is no environment-specific API URL in the frontend, and a shared link works the same everywhere.
- **The URL is the frontend's state.** Search, filters, sort and page are parsed from the query string (`catalogue-query.ts`), and data is loaded reactively with `rxResource`. "Send a colleague a link" is therefore just the browser URL. On phones the Share button opens the native share sheet.
- **UX for experts:**
  - Keyboard flow: `/` to search, `↑`/`↓` to move through results, `Enter` to open.
  - A clickable "function spectrum" shows the catalogue mix and doubles as a filter.
  - View Transitions carry the function glyph from the result row into the product header, so the navigation is easy to follow. This respects `prefers-reduced-motion`.

## 2. Key decisions

| Decision | Alternatives considered | Why |
| --- | --- | --- |
| **The seed is the PIM import.** One idempotent, transactional importer used for the first seed, re-runs and the nightly feed. | A separate Prisma seed script, plus an import job later | The brief's rules for the seed (idempotent, user data survives) are exactly the rules for the nightly import. Two code paths would drift. |
| **SKU is the business key, UUID is the primary key.** | SKU as primary key | Reviews reference the UUID, so a SKU correction in the PIM would not orphan reviews. |
| **Column ownership.** The import writes PIM fields only. Reviews, rating aggregates and `delistedAt` belong to the app. | Truncate and reload; full-row upsert | This is what makes re-running safe. Unchanged rows are not written at all, so `updated_at` stays meaningful. |
| **Products are never deleted.** A SKU that leaves the export gets `delistedAt`. It is hidden from search, but its page still opens with a "No longer offered" notice. | Hard delete; keep it as Active | Sales said customers ask about products that are no longer sold. We must not show those as available, but reviews and old shared links must keep working. FK `onDelete: Restrict` enforces this in the database. |
| **Discontinued is hidden by default.** Phase-out stays visible with a badge and a notice; Discontinued can be included with a toggle. | Show everything | It matches the same complaint: the default view only shows what can be bought. |
| **Search with `pg_trgm`** (ILIKE `%term%` on GIN trigram indexes) across SKU, name, chemical name, function, area and description. Every term must match. | Postgres full-text search (`tsvector`); Elasticsearch | Users search by partial SKUs and trade names ("quor", "P-1000"). Full-text search handles stemmed prose well but not prefixes. Trigram indexes handle substrings and stay fast at 50k rows. A search engine is not justified at this size. |
| **Server-side filtering, sorting and pagination; facets with counts from one SQL query.** | Load the whole catalogue on the client | Client-side is fine for 200 products but not for 50k, especially on phones at a trade fair. |
| **Cross-filtered facet counts.** Each facet is counted with every *other* active filter applied. Options with no matches stay in the list but are disabled. | Static counts over the whole catalogue (the first version) | Static counts promise results that aren't there, so customers click into empty lists. The value list stays stable, so the layout doesn't jump; the counts tell the truth. |
| **"Active alternatives" for Phase-out, Discontinued and delisted products.** Same function, ranked by application area, then region (or Global), then shared certifications. | Show only a notice; leave it to the sales contact | This is the business problem behind the brief: customers asking about products we no longer sell. The answer becomes "use this instead". Ranking runs in SQL over *all* active candidates of that function, so the best match can't be missed; it takes about 12 ms at 50k products. |
| **Certifications as `text[]` with a GIN index.** | Join tables | They are labels with no attributes. `hasEvery` plus a GIN index keeps the queries simple and fast. |
| **Denormalised `ratingAvg` / `ratingCount`.** They are recomputed in the same transaction as each review, under a `FOR UPDATE` row lock. | Compute on read | "Sort by rating" over 50k products needs an indexed column. The row lock keeps concurrent reviews from losing updates (covered by an e2e test). |
| **Anonymous reviews protected by** a per-IP rate limit (5 per 10 min), validation (DTO and a DB CHECK), plain-text storage escaped on render, and a honeypot field. | CAPTCHA; email verification | Auth is out of scope. These are cheap brakes, not security boundaries (see Risks). |
| **NestJS 11 rather than 12.** | Nest 12 | Nest 12 ships ESM-only, and Jest is mandated. Jest's ESM support is still experimental and fragile together with Prisma. The brief asks for "latest stable" only for Angular. |
| **Angular 22 and PrimeNG 22 with a PrimeUI Community key.** | Angular 21 with PrimeNG 21 (still MIT) | PrimeNG 22, the only version that supports Angular 22, is now under the commercial PrimeUI license and needs a key. The brief asks for the latest Angular, so we used the author's free Community key. See Risks. |
| **Visual system: "Precision Catalogue".** PrimeNG is re-tokened in its own three layers (primitive → semantic → component, using `light-dark()`), with mirrored SCSS tokens for layout. Light and dark themes follow the OS by default, with a System/Light/Dark switch in the header. Geist is self-hosted. Colour has three jobs only: **function** (8 hues, shown as a glyph tile with the code that is already in product names: SF, EF, PO…), **lifecycle**, and **focus/selection**. | Plain shadcn-style zinc dashboard (first version); Spartan/ui plus Tailwind; retro or print-inspired themes | A plain neutral UI reads as generic. Colour that encodes the product's function helps experts scan, and the function codes are real data rather than decoration. One token system serves both themes. My craft benchmarks were Linear/Vercel, Raycast and Stripe, and an independent design review checked the result against them. |
| **The import runs on every API start** (`SEED_ON_START`), and a failed import does not stop the API. | Manual-only seed | This gives a single `docker compose up`. If an export is bad, the site keeps serving the last good data. |

## 3. Assumptions

- **Duplicate SKUs:** the later row wins, and the conflict is reported. P-10151 appears as Active and then as Discontinued, so it ends up Discontinued. The export order is assumed to be PIM change order.
- **Rows without a name** (P-10119) are skipped and reported. A product cannot be shown without a name, and inventing one (for example from the chemical name) would be fabricating data. A broken row does **not** delist an existing product.
- **Status spellings** (`active`, `ACTIVE`, `Phase out`) are normalised. An unknown status skips the row, because we cannot decide whether customers may see it.
- **Invalid launch years** (`n/a`, out of range) are stored as unknown, with a warning.
- **Region:** a regional filter also returns *Global* products, since a customer in EMEA can buy a global product.
- **Certifications filter:** a product must have all selected certifications ("Vegan + Halal" means both). Within the other filters, selected values are OR-ed.
- **Reviews** are allowed on any existing product, including discontinued ones, because experience with a product stays useful. The display name is required and the company is optional; in B2B the company is often what makes a review credible.
- The **"data as of"** date in the header is the finish time of the last successful import.

## 4. Risks and how they are handled

| Risk | Mitigation now | Next step |
| --- | --- | --- |
| A truncated or empty export could wipe the visible catalogue | The import runs in a single transaction. If the file has fewer than 50% of the listed SKUs, nothing is delisted and a warning is raised. A bad header rejects the whole file. Every run is recorded in `import_runs`. | Alert on FAILED runs and on warnings |
| Two imports at once (several API replicas starting) | `pg_try_advisory_xact_lock`, so a second run fails fast | Move the import to a scheduled job |
| Review spam and abuse without auth | Rate limit per IP: 5 reviews per 10 min. The API is reachable only through nginx (the container isn't published), so `X-Forwarded-For` can't be spoofed to get round it. Also a honeypot, length limits and a DB CHECK. **Trade-off:** phones at a trade-fair booth share one public IP (NAT), so reads get a generous limit (600/min) and the review limit can be tuned via env. | Moderation queue or report button; verified-customer SSO; CAPTCHA if abuse appears |
| XSS through reviews | Stored as plain text and escaped by Angular. Helmet headers on the API. | CSP on nginx |
| Confidential information in public reviews | The form tells people not to post formulation details | Moderation |
| Facet counts cost several queries per keystroke (one per certification value) | Batched on a single DB connection, so they can't drain the pool. 70–95 ms at 50k products, the slowest call. | One SQL `unnest`/`GROUP BY` with the filter rendered in SQL, or cached counts per filter combination |
| "Catalogue updated" could be misleading | Shows the last import that actually changed data, not the last restart that re-read an unchanged file. Imports killed mid-run are closed as FAILED on the next start. | Store the export's own timestamp from the PIM |
| **PrimeNG license** | The key is not a secret, since it ships in the browser bundle, but it is per developer. It is injected at build time from `PRIMEUI_LICENSE_KEY` (`.env`, CI secret or Docker build arg). The author's free Community key is committed as a fallback so a fresh clone runs without the banner. | A large company needs a **Commercial PrimeUI license** for production, or should pin PrimeNG 21 (MIT) on Angular 21. **This is a business decision to raise.** |
| Growth to 50k products | **Measured, not assumed:** `npm run bench:scale` (section 4a). Indexes cover every filter, sort and search field; paging is server-side; the import vacuums after large changes. | Cache facet counts (~160 ms, the slowest call); use keyset pagination for deep pages; batch the update path with `INSERT … ON CONFLICT` |
| Initial JS bundle is 540 kB (127 kB gzipped), mostly PrimeNG theme tokens | Routes are lazy-loaded and fonts self-hosted; the budget was raised to 650 kB | Prune unused component tokens; look at a PrimeNG CSS-layer build |

### 4a. Scale evidence: 50,000 products

The brief expects ~50k products, so instead of claiming the design scales, I measured it. `npm run bench:scale` builds a synthetic 50k-row PIM export from the real catalogue's value pools, runs it through the **real importer** twice, and then times the **real service queries** (30 runs each after a warm-up). It also runs `EXPLAIN ANALYZE` on the search. These numbers come from a developer laptop (load average ≈ 3, with Docker and dev servers running):

| Import (50,000 rows) | Time | Result |
|---|---|---|
| First load into an empty database | 11 s | 50,000 created |
| Re-run of the same export | 0.7 s | created 0, updated 0, unchanged 50,000 (zero writes) |

| Query | p50 | p95 |
|---|---|---|
| List, default view | 3 ms | 4 ms |
| Search "sulf" (substring over 6 columns) | 9 ms | 10 ms |
| Search by SKU fragment | 4 ms | 6 ms |
| Region + function + certification filters | 5 ms | 8 ms |
| Sort by rating | 30 ms | 33 ms |
| Page 500 (offset) | 17 ms | 24 ms |
| Facets, whole catalogue | 95 ms | 103 ms |
| Facets, cross-filtered | 70 ms | 85 ms |
| Alternatives (ranked over all candidates) | 12 ms | 13 ms |

**What the benchmark caught:**

1. The first run showed search at **0.6–1 s**. The search ORs six columns, and two of them (`function`, `application_area`) had no trigram index, so a single unindexed column forced a sequential scan. A second migration adds those indexes.
2. Search was still slow straight after the bulk load. Postgres itself ran the queries in 3–5 ms (confirmed with `EXPLAIN` on the exact SQL Prisma generated). The time was going to **autovacuum** processing the freshly loaded table. The importer now runs `VACUUM (ANALYZE)` itself after changes larger than 1,000 rows, so the first customers after a large nightly import don't pay for it.

## 5. Deliberately left out, and what comes next for production

**Left out:** authentication, moderation, editing or deleting reviews, product comparison, i18n, and a UI for import runs. There are no browser E2E tests (Playwright) yet.

**To take this to production:**

1. Run the import as a scheduled job (cron, or a K8s CronJob) that watches the PIM drop, instead of on API start. Add alerting on failed or suspicious runs.
2. Add SSO for customers, so reviews come from verified customers, plus a moderation and report flow.
3. Extend CI with Playwright smoke tests on mobile and desktop viewports and a staging deploy. Lint, unit and e2e tests and the Docker boot already run on every push.
4. Add observability: structured logs, request metrics, slow-query logging.
5. Add a security pass: CSP, a per-route rate-limit store in Redis (the in-memory store does not work across replicas), and dependency scanning.
6. Settle the PrimeUI commercial license.
7. Add a "compare" shortlist, and product documents (SDS and TDS) once the PIM provides them.

*Time spent: about 2 hours.*
