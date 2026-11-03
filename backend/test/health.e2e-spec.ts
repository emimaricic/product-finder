import request from 'supertest';
import { createTestApp, TestAppContext } from './utils/test-app';

describe('Health (e2e)', () => {
  let ctx: TestAppContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('GET /api/health reports a reachable database', async () => {
    const res = await request(ctx.app.getHttpServer())
      .get('/api/health')
      .expect(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
