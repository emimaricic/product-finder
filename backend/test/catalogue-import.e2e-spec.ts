import { Test } from '@nestjs/testing';
import { ProductStatus } from '@prisma/client';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { CatalogueImportModule } from '../src/catalogue-import/catalogue-import.module';
import { CatalogueImportService } from '../src/catalogue-import/catalogue-import.service';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { truncateAll } from './utils/db';

/**
 * Runs the importer against a real Postgres with the real PIM export.
 * These are the guarantees the brief asks for: works on an empty DB,
 * safe to re-run, user data survives.
 */
describe('Catalogue import (integration)', () => {
  const realCsv = readFileSync(
    resolve(__dirname, '../../data/products.csv'),
    'utf8',
  );
  const [header, ...lines] = realCsv.trimEnd().split('\n');
  const csvWithout = (...skus: string[]) =>
    [
      header,
      ...lines.filter((l) => !skus.some((s) => l.startsWith(`${s},`))),
    ].join('\n');

  let prisma: PrismaService;
  let importer: CatalogueImportService;
  let close: () => Promise<void>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PrismaModule, CatalogueImportModule],
    }).compile();
    const app = await moduleRef.init();
    prisma = app.get(PrismaService);
    importer = app.get(CatalogueImportService);
    close = () => app.close();
  });

  beforeEach(() => truncateAll(prisma));
  afterAll(() => close());

  async function addReview(sku: string, rating: number) {
    const product = await prisma.product.findUniqueOrThrow({ where: { sku } });
    await prisma.review.create({
      data: {
        productId: product.id,
        rating,
        authorName: 'Ana',
        comment: 'Works well.',
      },
    });
    await prisma.product.update({
      where: { id: product.id },
      data: { ratingAvg: rating, ratingCount: 1 },
    });
  }

  it('populates an empty database from the real export', async () => {
    const summary = await importer.importCsv(realCsv, 'products.csv');

    // 202 rows − 2 duplicate SKUs − 1 row without a name (P-10119)
    expect(summary).toMatchObject({
      rowsRead: 202,
      created: 199,
      skipped: 1,
      updated: 0,
    });
    expect(await prisma.product.count()).toBe(199);

    const bySku = async (sku: string) =>
      prisma.product.findUniqueOrThrow({ where: { sku } });
    expect((await bySku('P-10008')).status).toBe(ProductStatus.ACTIVE); // "active"
    expect((await bySku('P-10042')).status).toBe(ProductStatus.PHASE_OUT); // "Phase out"
    expect((await bySku('P-10151')).status).toBe(ProductStatus.DISCONTINUED); // later duplicate wins
    expect((await bySku('P-10016')).region).toBe('EMEA'); // " EMEA "
    expect((await bySku('P-10105')).launchYear).toBeNull(); // "n/a"
    expect(
      await prisma.product.findUnique({ where: { sku: 'P-10119' } }),
    ).toBeNull();

    const run = await prisma.importRun.findUniqueOrThrow({
      where: { id: summary.runId },
    });
    expect(run.status).toBe('SUCCEEDED');
  });

  it('is idempotent: a second run creates and updates nothing', async () => {
    await importer.importCsv(realCsv, 'products.csv');
    const before = await prisma.product.findMany({ orderBy: { sku: 'asc' } });

    const second = await importer.importCsv(realCsv, 'products.csv');

    expect(second).toMatchObject({
      created: 0,
      updated: 0,
      unchanged: 199,
      delisted: 0,
    });
    expect(await prisma.product.findMany({ orderBy: { sku: 'asc' } })).toEqual(
      before,
    );
  });

  it('updates PIM fields but never touches reviews or rating aggregates', async () => {
    await importer.importCsv(realCsv, 'products.csv');
    await addReview('P-10001', 4);

    const renamed = realCsv.replace(
      'P-10001,Quorin SF 470,',
      'P-10001,Quorin SF 470 Plus,',
    );
    const summary = await importer.importCsv(renamed, 'products.csv');

    expect(summary.updated).toBe(1);
    const product = await prisma.product.findUniqueOrThrow({
      where: { sku: 'P-10001' },
      include: { reviews: true },
    });
    expect(product.name).toBe('Quorin SF 470 Plus');
    expect(product.reviews).toHaveLength(1);
    expect(product.ratingCount).toBe(1);
    expect(product.ratingAvg?.toNumber()).toBe(4);
  });

  it('delists a product that left the export, keeping its reviews, and relists it when it returns', async () => {
    await importer.importCsv(realCsv, 'products.csv');
    await addReview('P-10002', 5);

    const gone = await importer.importCsv(
      csvWithout('P-10002'),
      'products.csv',
    );
    expect(gone.delisted).toBe(1);
    const delisted = await prisma.product.findUniqueOrThrow({
      where: { sku: 'P-10002' },
      include: { reviews: true },
    });
    expect(delisted.delistedAt).not.toBeNull();
    expect(delisted.reviews).toHaveLength(1);

    const back = await importer.importCsv(realCsv, 'products.csv');
    expect(back).toMatchObject({ relisted: 1, created: 0 });
    expect(
      (await prisma.product.findUniqueOrThrow({ where: { sku: 'P-10002' } }))
        .delistedAt,
    ).toBeNull();
  });

  it('does not delist a product whose export row is invalid', async () => {
    await importer.importCsv(realCsv, 'products.csv');
    const broken = realCsv.replace('P-10003,Velumin EF 650,', 'P-10003,,');

    const summary = await importer.importCsv(broken, 'products.csv');

    expect(summary).toMatchObject({ skipped: 2, delisted: 0 });
    const kept = await prisma.product.findUniqueOrThrow({
      where: { sku: 'P-10003' },
    });
    expect(kept).toMatchObject({ name: 'Velumin EF 650', delistedAt: null });
  });

  it('refuses to mass-delist when the export looks truncated', async () => {
    await importer.importCsv(realCsv, 'products.csv');
    const truncated = [header, ...lines.slice(0, 20)].join('\n');

    const summary = await importer.importCsv(truncated, 'products.csv');

    expect(summary.delisted).toBe(0);
    expect(summary.issues).toContainEqual(
      expect.objectContaining({
        message: expect.stringMatching(/looks truncated/),
      }),
    );
    expect(await prisma.product.count({ where: { delistedAt: null } })).toBe(
      199,
    );
  });

  it('closes runs left RUNNING by a killed process as FAILED', async () => {
    const stale = await prisma.importRun.create({
      data: {
        source: 'killed',
        status: 'RUNNING',
        startedAt: new Date(Date.now() - 60 * 60_000),
      },
    });

    await importer.importCsv(realCsv, 'products.csv');

    expect(
      await prisma.importRun.findUniqueOrThrow({ where: { id: stale.id } }),
    ).toMatchObject({
      status: 'FAILED',
      error: expect.stringMatching(/Interrupted/),
    });
  });

  it('applies nothing and records a FAILED run when the file format is wrong', async () => {
    await expect(importer.importCsv('foo,bar\n1,2', 'bad.csv')).rejects.toThrow(
      /missing column/,
    );

    expect(await prisma.product.count()).toBe(0);
    const run = await prisma.importRun.findFirstOrThrow();
    expect(run).toMatchObject({ status: 'FAILED', source: 'bad.csv' });
  });
});
