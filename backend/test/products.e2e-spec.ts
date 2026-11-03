import request from 'supertest';
import { CatalogueImportService } from '../src/catalogue-import/catalogue-import.service';
import { truncateAll } from './utils/db';
import { REAL_CSV, seedCatalogue } from './utils/seed';
import { createTestApp, TestAppContext } from './utils/test-app';

interface ListBody {
  items: {
    sku: string;
    region: string;
    status: string;
    certifications: string[];
  }[];
  total: number;
  page: number;
  totalPages: number;
}

describe('Products API (e2e)', () => {
  let ctx: TestAppContext;
  const get = (url: string) => request(ctx.app.getHttpServer()).get(url);
  const list = async (qs: string) =>
    (await get(`/api/products?${qs}`).expect(200)).body as ListBody;

  beforeAll(async () => {
    ctx = await createTestApp();
    await truncateAll(ctx.prisma);
    await seedCatalogue(new CatalogueImportService(ctx.prisma));
  });

  afterAll(() => ctx.app.close());

  it('lists only sellable products by default (no Discontinued)', async () => {
    const body = await list('pageSize=100');
    expect(body.total).toBe(169); // 139 Active + 30 Phase-out
    expect(body.items.every((p) => p.status !== 'DISCONTINUED')).toBe(true);
  });

  it('paginates deterministically with no overlap between pages', async () => {
    const p1 = await list('pageSize=10&page=1');
    const p2 = await list('pageSize=10&page=2');
    expect(p1.totalPages).toBe(17);
    const overlap = p1.items.filter((a) =>
      p2.items.some((b) => b.sku === a.sku),
    );
    expect(overlap).toEqual([]);
  });

  it('searches by partial, case-insensitive text across fields', async () => {
    const body = await list('q=QUOR&pageSize=100');
    expect(body.total).toBeGreaterThan(0);
    const bySku = await list('q=p-10001');
    expect(bySku.items.map((p) => p.sku)).toEqual(['P-10001']);
  });

  it('combines filters: region (+Global) AND all selected certifications', async () => {
    const body = await list(
      'region=EMEA&certification=Vegan&certification=Halal&pageSize=100',
    );
    expect(body.total).toBeGreaterThan(0);
    for (const p of body.items) {
      expect(['EMEA', 'Global']).toContain(p.region);
      expect(p.certifications).toEqual(
        expect.arrayContaining(['Vegan', 'Halal']),
      );
    }
  });

  it('can include discontinued products on request', async () => {
    const body = await list(
      'status=ACTIVE&status=PHASE_OUT&status=DISCONTINUED',
    );
    expect(body.total).toBe(199);
  });

  it('rejects invalid and unknown query parameters with 400', async () => {
    const res = await get(
      '/api/products?pageSize=1000&sort=price&foo=bar',
    ).expect(400);
    expect((res.body as { message: string[] }).message).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/pageSize/),
        expect.stringMatching(/sort/),
      ]),
    );
  });

  it('returns facets with counts and the catalogue timestamp', async () => {
    const res = await get('/api/products/facets').expect(200);
    const body = res.body as Record<
      string,
      { value: string; count: number }[]
    > & {
      catalogueUpdatedAt: string;
    };
    expect(body.region.map((r) => r.value)).toContain('Global');
    expect(body.status.map((s) => s.value)).toEqual([
      'ACTIVE',
      'PHASE_OUT',
      'DISCONTINUED',
    ]);
    expect(body.catalogueUpdatedAt).toEqual(expect.any(String));
  });

  it('cross-filters facet counts: each facet is counted with the other filters applied', async () => {
    type Facets = Record<string, { value: string; count: number }[]>;
    const facets = async (qs: string) =>
      (await get(`/api/products/facets?${qs}`).expect(200)).body as Facets;
    const countOf = (f: Facets, key: string, value: string) =>
      f[key].find((v) => v.value === value)?.count ?? -1;

    const all = await facets('');
    const emea = await facets('region=EMEA');

    // Function counts shrink to what EMEA (+Global) actually has…
    const surfactantsInEmea = (
      await list('region=EMEA&function=Surfactant&pageSize=100')
    ).total;
    expect(countOf(emea, 'function', 'Surfactant')).toBe(surfactantsInEmea);
    expect(countOf(emea, 'function', 'Surfactant')).toBeLessThan(
      countOf(all, 'function', 'Surfactant'),
    );
    // …but the region facet itself is not narrowed by the region filter.
    expect(emea.region).toEqual(all.region);
    // Values never disappear, they drop to 0, so the UI can disable them.
    expect(emea.function.map((f) => f.value)).toEqual(
      all.function.map((f) => f.value),
    );
  });

  it('counts certifications as "results if this one is added" (AND semantics)', async () => {
    const res = await get('/api/products/facets?certification=Vegan').expect(
      200,
    );
    const halal = (
      res.body as Record<string, { value: string; count: number }[]>
    ).certification.find((c) => c.value === 'Halal');
    const both = await list(
      'certification=Vegan&certification=Halal&pageSize=100',
    );
    expect(halal?.count).toBe(both.total);
  });

  it('suggests active alternatives ranked by fit across ALL candidates', async () => {
    // P-10003: Emulsifier · Food & Nutrition · EMEA · Kosher, RSPO, Readily Biodegradable (Phase-out)
    const res = await get('/api/products/P-10003/alternatives').expect(200);
    const alts = res.body as {
      sku: string;
      function: string;
      status: string;
      applicationArea: string;
      region: string;
    }[];
    expect(alts.length).toBeGreaterThan(0);
    expect(alts.length).toBeLessThanOrEqual(4);
    for (const a of alts) {
      expect(a).toMatchObject({ function: 'Emulsifier', status: 'ACTIVE' });
      expect(a.sku).not.toBe('P-10003');
    }

    // The best possible match among all active emulsifiers must come first:
    // compute the expected top score independently from the full list.
    const all = (await list('function=Emulsifier&status=ACTIVE&pageSize=100'))
      .items as unknown as {
      sku: string;
      applicationArea: string;
      region: string;
      certifications: string[];
    }[];
    const certs = ['Kosher', 'RSPO Mass Balance', 'Readily Biodegradable'];
    const score = (p: (typeof all)[number]) =>
      (p.applicationArea === 'Food & Nutrition' ? 4 : 0) +
      (p.region === 'EMEA' || p.region === 'Global' ? 2 : 0) +
      p.certifications.filter((c) => certs.includes(c)).length;
    const best = Math.max(...all.filter((p) => p.sku !== 'P-10003').map(score));
    const first = all.find((p) => p.sku === alts[0].sku)!;
    expect(score(first)).toBe(best);

    await get('/api/products/P-00000/alternatives').expect(404);
  });

  it('counts a region together with Global products, matching what selecting it returns', async () => {
    const res = await get('/api/products/facets').expect(200);
    const emea = (
      res.body as Record<string, { value: string; count: number }[]>
    ).region.find((r) => r.value === 'EMEA');
    const results = await list('region=EMEA&pageSize=100');
    expect(emea?.count).toBe(results.total);
  });

  it('returns product detail by SKU (case-insensitive) and 404 for unknown', async () => {
    const res = await get('/api/products/p-10001').expect(200);
    expect(res.body).toMatchObject({
      sku: 'P-10001',
      listed: true,
      ratingCount: 0,
    });
    await get('/api/products/P-00000').expect(404);
  });

  it('keeps old links to a delisted product working (listed: false)', async () => {
    const withoutP10001 = REAL_CSV.split('\n')
      .filter((l) => !l.startsWith('P-10001,'))
      .join('\n');
    await seedCatalogue(new CatalogueImportService(ctx.prisma), withoutP10001);

    const res = await get('/api/products/P-10001').expect(200);
    expect(res.body).toMatchObject({ sku: 'P-10001', listed: false });
    const search = await list('q=P-10001');
    expect(search.total).toBe(0);
  });
});
