-- Runs once, on first start of an empty volume. Separate DB for e2e tests
-- so `npm run test:e2e` can truncate freely without touching dev data.
CREATE DATABASE product_finder_test OWNER finder;
