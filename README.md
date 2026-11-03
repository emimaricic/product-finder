# Product Finder

A web app where customers search the specialty chemicals catalogue, narrow it down with filters, share exactly what they are looking at as a link, and read and write product reviews. The catalogue is imported from the nightly PIM export (`data/products.csv`).

- **Frontend:** Angular 22, PrimeNG 22 (custom token preset, light + dark), SCSS, Jest
- **Backend:** NestJS 11, Prisma 7, PostgreSQL 17, Jest
- **Tooling:** Docker Compose, npm

The design decisions are in [DECISIONS.md](DECISIONS.md) and the AI collaboration notes are in [AI_USAGE.md](AI_USAGE.md). The original brief is in [ASSIGNMENT.md](ASSIGNMENT.md).

---

## Quick start (Docker, recommended)

Prerequisite: Docker with the Compose plugin (v2.24 or later).

```bash
docker compose up --build
```

Then open:

| URL | What |
| --- | --- |
| http://localhost:8080 | Product Finder (Angular, served by nginx) |
| http://localhost:8080/api/docs | Swagger / OpenAPI |
| http://localhost:8080/api/health | API health (also checks the database) |

There are no manual steps. On start the `api` container:

1. applies the Prisma migrations (`prisma migrate deploy`);
2. imports `data/products.csv`, which is the seed step (see below);
3. starts the API.

The web container waits until the API is healthy. Ports used: 8080 (web, and the API under `/api`) and 5434 (Postgres). The API container is deliberately not published: nginx is its only entry point.

To start again from an empty database, run `docker compose down -v && docker compose up --build`.

## The seed / catalogue import

The seed and the nightly PIM import are the same command. The import is idempotent:

- **Empty database:** it creates all products. With the provided file that is 199 products: 202 rows, minus 2 duplicate SKUs, minus 1 row without a name.
- **Running it again:** nothing is created or updated (`unchanged=199`), and reviews and ratings are never touched.
- **A SKU missing from a later export:** the product is marked *no longer offered*. It is not deleted, so its reviews and shared links keep working.

Ways to run it:

```bash
# Docker: re-import without restarting (e.g. after replacing data/products.csv)
docker compose exec api node dist/src/cli/import-catalogue.js

# Local
cd backend && npm run db:seed                 # defaults to ../data/products.csv
cd backend && npm run db:seed -- path/to/export.csv
```

`data/` is mounted into the API container. To simulate the nightly export, replace the file and restart the API (`docker compose restart api`). Set `SEED_ON_START=false` to skip the import on start.

Every run is logged in the `import_runs` table with its counts and the data-quality issues it found (skipped rows, corrected values, conflicting duplicates). The import also logs a summary to stdout.

### Importing your own export (for example 50,000 products)

The file needs the same columns as `data/products.csv` (`sku, name, chemical_name, function, application_area, region, certifications, status, launch_year, description`), in any order. Certifications are separated with `|`. Put the file into `data/` (the folder is mounted into the API container at `/app/data`), then either:

```bash
# A) Replace the default export; the import runs on the next start
cp ~/exports/catalogue.csv data/products.csv
docker compose restart api

# B) Import a file under its own name, without restarting
cp ~/exports/catalogue.csv data/catalogue.csv
docker compose exec api node dist/src/cli/import-catalogue.js /app/data/catalogue.csv
```

Check the result with `docker compose logs api | grep created=`. You'll see a line like `created=… updated=… unchanged=… skipped=… delisted=…`.

What to expect:

- **Products that are not in the new file are hidden, not deleted** (they become *no longer offered*). Importing an unrelated 50k file hides the 199 sample products, which is the intended nightly-import behaviour.
- **If the file contains fewer than half of the currently listed SKUs**, nothing is hidden. That looks like a truncated export, so a warning is logged instead.
- **A file with a wrong header is rejected as a whole**, and nothing changes.

To measure performance at 50,000 products without touching your data, use `npm run bench:scale` (see Tests). It generates synthetic products in the separate test database.

## Local development (without Docker for the apps)

Prerequisites:

- **Node.js 24** (or ≥ 22.22.3). Angular 22 does not run on older Node 22 releases. `nvm use` picks the version from `.nvmrc`.
- Docker, used only for Postgres.

```bash
nvm use
docker compose up -d postgres            # Postgres on localhost:5434 (also creates the test DB)

# Backend: http://localhost:3000
cd backend
cp .env.example .env
npm ci
npm run db:deploy                        # apply migrations
npm run db:seed                          # import data/products.csv
npm run start:dev

# Frontend: http://localhost:4200 (proxies /api to :3000)
cd frontend
npm ci
npm start
```

## Tests

```bash
# Backend unit tests (import rules, query building, health)
cd backend && npm test

# Backend integration / e2e: real Postgres, real CSV, HTTP through the full Nest app
docker compose up -d postgres
cd backend && npm run db:test:prepare && npm run test:e2e

# Frontend unit/component tests (URL state, review form, lifecycle notices, API errors)
cd frontend && npm test
```

```bash
# Scale benchmark: 50,000 synthetic products through the real importer and queries (uses the test DB)
cd backend && npm run db:test:prepare && npm run bench:scale
```

CI (`.github/workflows/ci.yml`) runs all of the above on every push, plus a full `docker compose` boot from an empty database.

The e2e tests use a separate database (`product_finder_test`, created by `backend/docker/postgres/init.sql`) and truncate it between tests. They never touch the dev data. Both projects also have `npm run lint`.

## Project structure

```
backend/
  prisma/                     schema + migrations (pg_trgm, CHECK constraint)
  src/catalogue-import/       CSV parse → normalise → plan → transactional upsert
  src/cli/import-catalogue.ts seed / nightly import entry point
  src/products/               search, facets, detail
  src/reviews/                list + anonymous create (rate limited)
  test/                       e2e (import, products, reviews, health)
frontend/
  src/app/core/               API client, error handling, theme (PrimeNG preset)
  src/app/features/catalogue/ search page; URL ⇄ query state (catalogue-query.ts)
  src/app/features/product/   data sheet, lifecycle notice, reviews, review form
data/products.csv             PIM export
docker-compose.yml            postgres + api + web
```

## Configuration

See `backend/.env.example`. In Docker everything has a working default. The most relevant settings:

| Variable | Default | Purpose |
| --- | --- | --- |
| `SEED_ON_START` | `true` | Import the CSV on API start |
| `CATALOGUE_CSV_PATH` | `../data/products.csv` | Location of the PIM export |
| `REVIEW_RATE_LIMIT_MAX` / `_TTL_MS` | 5 per 10 min | Anonymous review spam brake (per IP) |
| `TRUST_PROXY` | `1` in Docker | Real client IPs behind nginx (needed for the rate limit) |

**PrimeNG license:** PrimeNG 22 requires a PrimeUI license key. It is not a secret (it ships in the browser bundle) but it is per developer, so it is injected at build time from `PRIMEUI_LICENSE_KEY`: set it in `frontend/.env` (see `frontend/.env.example`), as a CI secret, or in your shell before `docker compose up --build`. If it isn't set, the author's free Community key committed in `primeui-license.ts` is used. Without any valid key PrimeNG still works but shows an "Invalid PrimeUI License" banner. See DECISIONS.md.
