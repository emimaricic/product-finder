import request from 'supertest';
import { CatalogueImportService } from '../src/catalogue-import/catalogue-import.service';
import { truncateAll } from './utils/db';
import { seedCatalogue } from './utils/seed';
import { createTestApp, TestAppContext } from './utils/test-app';

describe('Reviews API (e2e)', () => {
  let ctx: TestAppContext;
  const server = () => ctx.app.getHttpServer();
  const post = (sku: string, body: object) =>
    request(server()).post(`/api/products/${sku}/reviews`).send(body);
  const valid = {
    rating: 4,
    authorName: 'Ana',
    comment: 'Easy to formulate with.',
  };

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  beforeEach(async () => {
    await truncateAll(ctx.prisma);
    await seedCatalogue(new CatalogueImportService(ctx.prisma));
  });

  afterAll(() => ctx.app.close());

  it('publishes a review and updates the product rating summary', async () => {
    await post('P-10001', valid).expect(201);
    await post('P-10001', { ...valid, rating: 5, authorName: 'Bob' }).expect(
      201,
    );

    const reviews = await request(server())
      .get('/api/products/P-10001/reviews')
      .expect(200);
    expect(reviews.body).toMatchObject({
      total: 2,
      ratingAvg: 4.5,
      ratingCount: 2,
      distribution: [0, 0, 0, 1, 1],
    });
    expect(
      (reviews.body as { items: { authorName: string }[] }).items[0].authorName,
    ).toBe('Bob');

    const product = await request(server())
      .get('/api/products/P-10001')
      .expect(200);
    expect(product.body).toMatchObject({ ratingAvg: 4.5, ratingCount: 2 });
  });

  it('keeps aggregates correct under concurrent submissions', async () => {
    await Promise.all(
      [1, 2, 3, 4, 5].map((rating) =>
        post('P-10002', { ...valid, rating }).expect(201),
      ),
    );
    const product = await ctx.prisma.product.findUniqueOrThrow({
      where: { sku: 'P-10002' },
    });
    expect(product.ratingCount).toBe(5);
    expect(product.ratingAvg?.toNumber()).toBe(3);
  });

  it('validates input and normalises whitespace', async () => {
    const bad = await post('P-10001', {
      rating: 6,
      authorName: 'A',
      comment: 'short',
    }).expect(400);
    expect((bad.body as { message: string[] }).message).toHaveLength(3);

    const ok = await post('P-10001', {
      ...valid,
      authorName: '  Ana   K. ',
      comment: 'Line one.\r\n\r\n\r\n\r\nLine two.',
    }).expect(201);
    expect(ok.body).toMatchObject({
      authorName: 'Ana K.',
      comment: 'Line one.\n\nLine two.',
    });
  });

  it('stores markup as inert text (rendering escapes it)', async () => {
    const res = await post('P-10001', {
      ...valid,
      comment: '<script>alert(1)</script> nice',
    }).expect(201);
    expect((res.body as { comment: string }).comment).toBe(
      '<script>alert(1)</script> nice',
    );
  });

  it('silently drops honeypot submissions', async () => {
    await post('P-10001', { ...valid, website: 'http://spam.example' }).expect(
      201,
    );
    expect(await ctx.prisma.review.count()).toBe(0);
  });

  it('returns 404 when reviewing an unknown product', async () => {
    await post('P-00000', valid).expect(404);
  });

  it('rate limits review submissions per client', async () => {
    const previous = process.env.REVIEW_RATE_LIMIT_MAX;
    process.env.REVIEW_RATE_LIMIT_MAX = '2';
    try {
      // Unique client IP so other tests' submissions don't count.
      const as = (body: object) =>
        post('P-10003', body).set('X-Forwarded-For', '203.0.113.7');
      await as(valid).expect(201);
      await as(valid).expect(201);
      const res = await as(valid).expect(429);
      expect((res.body as { message: string }).message).toMatch(
        /Too many requests/,
      );
    } finally {
      process.env.REVIEW_RATE_LIMIT_MAX = previous;
    }
  });

  it('survives a re-import of the catalogue', async () => {
    await post('P-10001', valid).expect(201);
    await seedCatalogue(new CatalogueImportService(ctx.prisma));
    const res = await request(server())
      .get('/api/products/P-10001/reviews')
      .expect(200);
    expect(res.body).toMatchObject({ total: 1, ratingAvg: 4, ratingCount: 1 });
  });
});
