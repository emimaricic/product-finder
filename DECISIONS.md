# Decisions

## 1. Architecture

```
Browser ── nginx :8080 ─┬─ /      Angular SPA (static files, SPA fallback)
                        └─ /api   NestJS API ── PostgreSQL (Prisma migrations)
data/products.csv (nightly PIM export) ── CLI import, same code as the seed
```

- **One repository, one command.** `docker compose up --build` starts postgres, api and web, and applies migrations and the import on the way.
- **Same origin.** nginx (Docker) and the Angular proxy (dev) both forward `/api`, so there is no CORS and no environment-specific API URL.
- **The URL is the frontend's state.** Search, filters, sort and page live in the query string, so "send a colleague a link" is just the browser URL.
- **CI** runs lint, unit tests and e2e tests on a real Postgres, builds both apps, then boots the Docker stack from an empty database.

## 2. Key decisions

| Decision | Alternative | Why |
| --- | --- | --- |
| **The seed is the PIM import:** one idempotent, transactional importer | Separate seed script and import job | Both have the same rules (idempotent, user data survives). Two code paths would drift. |
| **The import writes PIM columns only.** Reviews, rating aggregates and `delistedAt` belong to the app. | Truncate and reload | This is what makes re-running safe. Unchanged rows are not written at all. |
| **SKU is the business key, UUID the primary key** | SKU as primary key | A SKU correction in the PIM would not orphan reviews. |
| **Products are never deleted.** A SKU that leaves the export is hidden from search, but its page still opens with a "No longer offered" notice. | Hard delete | Customers must not see it as available, but reviews and shared links must keep working. |
| **Discontinued is hidden by default,** Phase-out is visible with a notice | Show everything | Answers the sales complaint: the default view shows what can be bought. |
| **Active alternatives** on retiring products: same function, ranked in SQL by application area, region and shared certifications | Notice only | Turns "we no longer sell this" into "use this instead". |
| **`pg_trgm` substring search** over six text columns | Full-text search; Elasticsearch | Users type fragments of SKUs and trade names. Full-text search matches words and prefixes, not substrings. A search engine isn't justified at 50k rows. |
| **Server-side filtering, sorting and paging,** with cross-filtered facet counts | Filter on the client | Fine for 200 products, not for 50k on a phone. Each facet is counted with the other filters applied, so counts match what a click returns. |
| **Certifications as `text[]` with a GIN index** | Join tables | They are labels without attributes. |
| **Denormalised rating,** recomputed under a `FOR UPDATE` row lock | Compute on read | "Sort by rating" needs an indexed column. The lock stops concurrent reviews losing updates. |
| **NestJS 11** | NestJS 12 | Nest 12 is ESM-only and Jest is mandated. Jest's ESM support is still experimental, and the brief asks for "latest" only for Angular. |
| **Angular 22 and PrimeNG 22 with a PrimeUI key** | Angular 21 and PrimeNG 21 (MIT) | Only PrimeNG 22 supports Angular 22, and it now needs a license key. See Risks. |
| **PrimeNG re-tokened** (primitive → semantic → component) with light and dark themes. Colour has three jobs: function, lifecycle, focus. | Second UI library; Tailwind | PrimeNG and SCSS are fixed. Function colours use codes already in product names (SF, EF, PO), so colour helps experts scan. |
| **The import runs on API start;** a failed import doesn't stop the API | Manual seed | One command to run. A bad export leaves the last good data online. |

## 3. Assumptions

- **Duplicate SKUs:** the later row wins and the conflict is reported (P-10151 ends up Discontinued). I assume the export is in PIM change order.
- **Rows without a name** (P-10119) are skipped and reported, not invented. A broken row does not delist an existing product.
- **Status spellings** are normalised. An unknown status skips the row, because we can't tell whether customers may see it.
- **Invalid launch years** are stored as unknown, with a warning.
- **Region:** a regional filter also returns Global products, and its count includes them.
- **Certifications:** a product must have all selected ones. Other filters are OR-ed within the filter.
- **Reviews** are allowed on any existing product, including discontinued ones.
- **"Synced" date** is the last import that actually changed data.

## 4. Risks

| Risk | Now | Next |
| --- | --- | --- |
| A truncated export hides the catalogue | One transaction. Below 50% of listed SKUs nothing is delisted. A bad header rejects the file. Runs are logged in `import_runs`. | Alert on failed runs |
| Two imports at once | Advisory lock; interrupted runs are closed as FAILED | Scheduled job |
| Review spam without auth | 5 reviews per 10 min per IP, honeypot, length limits, DB CHECK. Only nginx reaches the API, so `X-Forwarded-For` can't be forged. **Trade-off:** phones at a fair share one IP, so reads allow 600/min and limits are configurable. | Verified customers, moderation |
| XSS through reviews | Plain text, escaped by Angular; Helmet on the API | CSP on nginx |
| **PrimeNG license** | The key ships in the browser bundle, so it isn't a secret, but it is per developer. It is injected from `PRIMEUI_LICENSE_KEY`, with my free Community key as a fallback so a fresh clone shows no banner. | Production at a large company needs a Commercial license, or PrimeNG 21 on Angular 21. **A business decision to raise.** |
| Facets are the slowest call (one count per certification value) | Batched on one connection; 70–95 ms at 50k | One SQL query, or cached counts |
| Initial bundle 549 kB (129 kB gzipped), mostly theme tokens | Lazy routes; budget raised to 650 kB | Prune unused tokens |

### Scale evidence at 50,000 products

`npm run bench:scale` builds a synthetic 50k export and runs it through the real importer and service queries (30 runs after warm-up, on a developer laptop):

| Operation | p50 | p95 |
| --- | --- | --- |
| List, default view | 3 ms | 4 ms |
| Search "sulf" (6 columns) | 9 ms | 10 ms |
| Region + function + certification | 5 ms | 8 ms |
| Sort by rating | 30 ms | 33 ms |
| Page 500 (offset) | 17 ms | 24 ms |
| Facets, whole catalogue / filtered | 95 / 70 ms | 103 / 85 ms |
| Alternatives | 12 ms | 13 ms |

First import takes 11 s. Re-running it takes 0.7 s with zero writes.

The benchmark caught two problems. Search first took 0.6–1 s because two of the six ORed columns had no trigram index, which forced a sequential scan. It was also slow right after a bulk load while autovacuum processed the table, so the importer now runs `VACUUM (ANALYZE)` after large changes.

## 5. Left out, and next steps

**Left out:** authentication, moderation, editing reviews, product comparison, i18n, a UI for import runs, browser E2E tests.

**For production:** run the import as a scheduled job with alerting; add SSO for verified reviewers and moderation; add Playwright to CI and a staging deploy; add observability; add CSP and a Redis rate-limit store (the in-memory one doesn't work across replicas); generate the frontend models from the OpenAPI spec; settle the PrimeUI license.

*Time spent: about 2 hours.*
