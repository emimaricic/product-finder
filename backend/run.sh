#!/bin/sh
set -e

echo "==> Applying database migrations..."
npx prisma migrate deploy

# The import is idempotent, so running it on every start is safe and doubles
# as "pick up the latest PIM export": drop a new CSV in, restart the api.
if [ "${SEED_ON_START:-true}" = "true" ]; then
  echo "==> Importing catalogue from ${CATALOGUE_CSV_PATH}..."
  # A bad export must not take the site down — keep serving the last good data.
  node dist/src/cli/import-catalogue.js || echo "!! Catalogue import failed, serving existing data"
fi

echo "==> Starting Product Finder API on port ${PORT:-3000}..."
exec node dist/src/main.js
