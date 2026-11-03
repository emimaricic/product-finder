/**
 * Scale benchmark: does the design hold at the brief's target of ~50,000
 * products?  Runs against the TEST database (it truncates it).
 *
 *   npm run bench:scale            # 50,000 products
 *   npm run bench:scale -- 100000  # any size
 *
 * 1. Builds a synthetic PIM export from the real catalogue's value pools.
 * 2. Times the real importer: first load, then an idempotent re-run.
 * 3. Times the real ProductsService queries (p50/p95 over 30 runs).
 * 4. EXPLAINs the search query to show the trigram indexes are used.
 */
import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { performance } from 'perf_hooks';
import { CatalogueImportService } from '../src/catalogue-import/catalogue-import.service';
import { parseCatalogueCsv } from '../src/catalogue-import/parse-catalogue-csv';
import { ListProductsQuery } from '../src/products/dto/list-products.query';
import { ProductSort } from '../src/products/product-sort';
import { AlternativesService } from '../src/products/alternatives.service';
import { ProductFacetsService } from '../src/products/facets.service';
import { ProductsService } from '../src/products/products.service';
import { PrismaService } from '../src/prisma/prisma.service';

const SIZE = Number(process.argv[2] ?? 50_000);
const RUNS = 30;
const WARMUP = 3;

Logger.overrideLogger(['error']); // keep importer logs out of the report

function pools() {
  const rows = parseCatalogueCsv(
    readFileSync(resolve(__dirname, '../../data/products.csv'), 'utf8'),
  ).map((r) => r.row);
  const uniq = (xs: string[]) => [...new Set(xs.map((x) => x.trim()).filter(Boolean))];
  return {
    chemicals: uniq(rows.map((r) => r.chemical_name)),
    functions: uniq(rows.map((r) => r.function)),
    areas: uniq(rows.map((r) => r.application_area)),
    regions: uniq(rows.map((r) => r.region)),
    certs: uniq(rows.flatMap((r) => r.certifications.split('|'))),
    brands: ['Quorin', 'Novarel', 'Velumin', 'Ternix', 'Axolan', 'Brevana', 'Calvera', 'Hydrova', 'Lumexa', 'Meridan', 'Puraxin', 'Siltera'],
  };
}

/** Deterministic PRNG so every run benchmarks the same catalogue. */
function rng(seed = 42) {
  let s = seed;
  return () => ((s = (s * 1664525 + 1013904223) % 2 ** 32) / 2 ** 32);
}

function syntheticCsv(size: number): string {
  const p = pools();
  const r = rng();
  const pick = <T>(xs: T[]) => xs[Math.floor(r() * xs.length)];
  const codes: Record<string, string> = {
    Antioxidant: 'AO', Emollient: 'EM', Emulsifier: 'EF', Polymer: 'PO',
    Preservative: 'PR', 'Rheology Modifier': 'RM', Solvent: 'SV', Surfactant: 'SF',
  };
  const lines = ['sku,name,chemical_name,function,application_area,region,certifications,status,launch_year,description'];
  for (let i = 0; i < size; i++) {
    const fn = pick(p.functions);
    const chem = pick(p.chemicals);
    const area = pick(p.areas);
    const certs = p.certs.filter(() => r() < 0.25).join('|');
    const roll = r();
    const status = roll < 0.8 ? 'Active' : roll < 0.9 ? 'Phase-out' : 'Discontinued';
    const name = `${pick(p.brands)} ${codes[fn] ?? 'XX'} ${100 + Math.floor(r() * 900)}`;
    const desc = `${fn} based on ${chem} for ${area.toLowerCase()} applications.`;
    lines.push(
      [`P-${200000 + i}`, name, chem, fn, area, pick(p.regions), certs, status, 2000 + Math.floor(r() * 26), `"${desc}"`].join(','),
    );
  }
  return lines.join('\n');
}

async function time<T>(fn: () => Promise<T>): Promise<number> {
  const t = performance.now();
  await fn();
  return performance.now() - t;
}

async function bench(fn: () => Promise<unknown>) {
  for (let i = 0; i < WARMUP; i++) await fn();
  const ms: number[] = [];
  for (let i = 0; i < RUNS; i++) ms.push(await time(fn));
  ms.sort((a, b) => a - b);
  const q = (p: number) => ms[Math.min(ms.length - 1, Math.floor(p * ms.length))];
  return { p50: q(0.5), p95: q(0.95) };
}

function query(over: Partial<ListProductsQuery> = {}): ListProductsQuery {
  return Object.assign(new ListProductsQuery(), { sort: ProductSort.NAME, page: 1, pageSize: 20 }, over);
}

async function main() {
  const prisma = new PrismaService();
  await prisma.$connect();
  const importer = new CatalogueImportService(prisma);
  const products = new ProductsService(prisma);
  const facets = new ProductFacetsService(prisma);
  const alternatives = new AlternativesService(prisma);
  const fmt = (ms: number) => `${ms.toFixed(1)} ms`;

  console.log(`\nScale benchmark: ${SIZE.toLocaleString('en')} products (database: ${new URL(process.env.DATABASE_URL!).pathname.slice(1)})\n`);
  await prisma.$executeRawUnsafe('TRUNCATE products, reviews, import_runs RESTART IDENTITY CASCADE');

  const csv = syntheticCsv(SIZE);
  let summary!: Awaited<ReturnType<CatalogueImportService['importCsv']>>;
  const first = await time(async () => (summary = await importer.importCsv(csv, 'bench')));
  const again = await time(async () => (summary = await importer.importCsv(csv, 'bench')));
  console.log('| Import | Time | Result |\n|---|---|---|');
  console.log(`| First load (empty DB) | ${(first / 1000).toFixed(1)} s | |`);
  console.log(`| Re-run, same export (idempotent) | ${(again / 1000).toFixed(1)} s | created=${summary.created} updated=${summary.updated} unchanged=${summary.unchanged} |`);

  // Give 10% of products ratings so "Top rated" sorts something real.
  await prisma.$executeRawUnsafe(
    `UPDATE products SET rating_avg = round((1 + random() * 4)::numeric, 2), rating_count = 1 + floor(random() * 20)
     WHERE id IN (SELECT id FROM products ORDER BY random() LIMIT ${Math.floor(SIZE / 10)})`,
  );
  // A bulk load leaves the table for autovacuum to process; measuring before
  // that finishes mostly measures autovacuum (first runs here: ~0.5–1 s searches).
  // The nightly import job should do the same after large changes.
  await prisma.$executeRawUnsafe('VACUUM ANALYZE products');

  const sample = await prisma.product.findFirstOrThrow({ where: { status: 'PHASE_OUT' }, select: { sku: true } });
  const cases: [string, () => Promise<unknown>][] = [
    ['List, default view (page 1)', () => products.list(query())],
    ['Search "sulf" (substring, 6 text columns)', () => products.list(query({ q: 'sulf' }))],
    ['Search by SKU fragment "P-2345"', () => products.list(query({ q: 'P-2345' }))],
    ['Filters: EMEA(+Global) + Surfactant + Vegan', () =>
      products.list(query({ region: ['EMEA'], function: ['Surfactant'], certification: ['Vegan'] }))],
    ['Sort: top rated', () => products.list(query({ sort: ProductSort.RATING }))],
    ['Deep page (page 500)', () => products.list(query({ page: 500 }))],
    ['Facets, whole catalogue', () => facets.facets({})],
    ['Facets, cross-filtered (EMEA + Vegan)', () => facets.facets({ region: ['EMEA'], certification: ['Vegan'] })],
    ['Alternatives for a phase-out product', () => alternatives.forSku(sample.sku)],
  ];
  console.log(`\n| Query (${RUNS} runs after ${WARMUP} warm-up) | p50 | p95 |\n|---|---|---|`);
  for (const [label, fn] of cases) {
    const r = await bench(fn);
    console.log(`| ${label} | ${fmt(r.p50)} | ${fmt(r.p95)} |`);
  }

  const plan = await prisma.$queryRawUnsafe<{ 'QUERY PLAN': string }[]>(
    `EXPLAIN ANALYZE SELECT sku FROM products
     WHERE delisted_at IS NULL AND status IN ('ACTIVE','PHASE_OUT')
       AND (name ILIKE '%sulf%' OR sku ILIKE '%sulf%' OR chemical_name ILIKE '%sulf%' OR description ILIKE '%sulf%')`,
  );
  const lines = plan.map((r) => r['QUERY PLAN']);
  const indexes = [...new Set(lines.join('\n').match(/products_\w+_trgm_idx/g) ?? [])];
  console.log(`\nSearch plan uses trigram indexes: ${indexes.length ? indexes.join(', ') : 'NO (sequential scan)'}`);
  console.log(lines.filter((l) => /Execution Time|Bitmap|Seq Scan/.test(l)).map((l) => `    ${l.trim()}`).join('\n'));

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
