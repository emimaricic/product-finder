import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductSummaryDto } from './dto/product.response';
import { GLOBAL_REGION } from './product-query';
import { normalizeSku, SUMMARY_SELECT, toSummary } from './product-summary';

/**
 * Active replacements for a product: same function, ranked by how well they
 * fit the original's use. Answers the sales complaint behind the brief —
 * customers asking for products we no longer sell — with "use this instead".
 *
 * Ranking runs in Postgres over ALL active candidates of that function
 * (indexed on function + status), so the best match is never missed:
 *   same application area  +4
 *   available in the region (same region, or either side is Global)  +2
 *   each shared certification  +1
 *   ties → higher customer rating → name (deterministic)
 */
@Injectable()
export class AlternativesService {
  constructor(private readonly prisma: PrismaService) {}

  async forSku(sku: string, limit = 4): Promise<ProductSummaryDto[]> {
    const original = await this.prisma.product.findUnique({
      where: { sku: normalizeSku(sku) },
      select: {
        id: true,
        function: true,
        applicationArea: true,
        region: true,
        certifications: true,
      },
    });
    if (!original) throw new NotFoundException(`Product ${sku} not found`);

    const ranked = await this.prisma.$queryRaw<{ sku: string }[]>`
      SELECT sku FROM products
      WHERE function = ${original.function}
        AND status = 'ACTIVE' AND delisted_at IS NULL
        AND id <> ${original.id}::uuid
      ORDER BY
        (application_area = ${original.applicationArea})::int * 4
        + (region = ${original.region} OR region = ${GLOBAL_REGION} OR ${original.region} = ${GLOBAL_REGION})::int * 2
        + cardinality(ARRAY(
            SELECT unnest(certifications)
            INTERSECT SELECT unnest(${original.certifications}::text[])
          )) DESC,
        rating_avg DESC NULLS LAST,
        name ASC
      LIMIT ${limit}`;

    const skus = ranked.map((r) => r.sku);
    const rows = await this.prisma.product.findMany({
      where: { sku: { in: skus } },
      select: SUMMARY_SELECT,
    });
    const bySku = new Map(rows.map((r) => [r.sku, r]));
    return skus.flatMap((s) => {
      const row = bySku.get(s);
      return row ? [toSummary(row)] : [];
    });
  }
}
