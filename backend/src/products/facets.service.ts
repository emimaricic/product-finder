import { Injectable } from '@nestjs/common';
import { Prisma, ProductStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ListProductsQuery } from './dto/list-products.query';
import { FacetValueDto, ProductFacetsDto } from './dto/product.response';
import {
  buildProductWhere,
  DEFAULT_STATUSES,
  GLOBAL_REGION,
} from './product-query';

type FacetKey = Exclude<keyof ProductFacetsDto, 'catalogueUpdatedAt'>;
interface FacetRow {
  facet: FacetKey;
  value: string;
  count: bigint;
}

/**
 * Selecting a region returns that region's products PLUS Global ones
 * (buildProductWhere), so its count must too — otherwise "EMEA (40)" opens
 * 94 results and a region with only Global matches looks empty.
 */
export function regionCounts(raw: Map<string, number>): Map<string, number> {
  const global = raw.get(GLOBAL_REGION) ?? 0;
  return new Map(
    [...raw].map(([region, n]) => [
      region,
      region === GLOBAL_REGION ? n : n + global,
    ]),
  );
}

@Injectable()
export class ProductFacetsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Faceted counts, cross-filtered: each facet is counted with every OTHER
   * active filter applied (the standard faceted-search rule), so a number
   * next to an option is exactly how many results ticking it would give.
   * The value lists come from the whole visible catalogue, so options with
   * 0 matches still render (disabled) instead of jumping around.
   */
  async facets(
    query: Partial<ListProductsQuery> = {},
  ): Promise<ProductFacetsDto> {
    const statuses = Prisma.join(
      DEFAULT_STATUSES.map((s) => Prisma.sql`${s}::"ProductStatus"`),
    );
    const visible = Prisma.sql`delisted_at IS NULL AND status IN (${statuses})`;
    const without = (key: keyof ListProductsQuery) =>
      buildProductWhere({ ...query, [key]: undefined });

    // Value universe (one round trip). Column names are literals, not input.
    const universeP = this.prisma.$queryRaw<FacetRow[]>`
      SELECT 'function' AS facet, function AS value, 0::bigint AS count
        FROM products WHERE ${visible} GROUP BY function
      UNION ALL
      SELECT 'applicationArea', application_area, 0 FROM products WHERE ${visible} GROUP BY application_area
      UNION ALL
      SELECT 'region', region, 0 FROM products WHERE ${visible} GROUP BY region
      UNION ALL
      SELECT 'certification', cert, 0
        FROM products, unnest(certifications) AS cert WHERE ${visible} GROUP BY cert`;

    const [universe, byFunction, byArea, byRegion, byStatus, lastRun] =
      await Promise.all([
        universeP,
        this.prisma.product.groupBy({
          by: ['function'],
          where: without('function'),
          _count: { _all: true },
        }),
        this.prisma.product.groupBy({
          by: ['applicationArea'],
          where: without('applicationArea'),
          _count: { _all: true },
        }),
        this.prisma.product.groupBy({
          by: ['region'],
          // Region keeps "+Global" semantics only for the selection itself.
          where: without('region'),
          _count: { _all: true },
        }),
        this.prisma.product.groupBy({
          by: ['status'],
          where: buildProductWhere({
            ...query,
            status: Object.values(ProductStatus),
          }),
          _count: { _all: true },
        }),
        // "Catalogue updated" = the last import that actually changed data,
        // not the last restart that re-read an unchanged export.
        this.prisma.importRun.findFirst({
          where: {
            status: 'SUCCEEDED',
            OR: [
              { created: { gt: 0 } },
              { updated: { gt: 0 } },
              { delisted: { gt: 0 } },
              { relisted: { gt: 0 } },
            ],
          },
          orderBy: { startedAt: 'desc' },
          select: { finishedAt: true },
        }),
      ]);

    // Certifications are AND-ed: the count for C is "results if C is added".
    const selectedCerts = query.certification ?? [];
    const certBase = without('certification');
    const certValues = universe
      .filter((r) => r.facet === 'certification')
      .map((r) => r.value);
    // One query per certification, batched on ONE connection ($transaction
    // array) so a keystroke can't take N pool connections. A single
    // unnest/GROUP BY needs the filter in raw SQL; see DECISIONS (next steps).
    const certCounts = await this.prisma.$transaction(
      certValues.map((cert) =>
        this.prisma.product.count({
          where: {
            AND: [
              certBase,
              {
                certifications: {
                  hasEvery: [...new Set([...selectedCerts, cert])],
                },
              },
            ],
          },
        }),
      ),
    );

    const counts: Record<FacetKey, Map<string, number>> = {
      function: new Map(byFunction.map((r) => [r.function, r._count._all])),
      applicationArea: new Map(
        byArea.map((r) => [r.applicationArea, r._count._all]),
      ),
      region: regionCounts(
        new Map(byRegion.map((r) => [r.region, r._count._all])),
      ),
      certification: new Map(certValues.map((v, i) => [v, certCounts[i]])),
      status: new Map<string, number>(
        byStatus.map((r) => [r.status, r._count._all]),
      ),
    };

    const result: ProductFacetsDto = {
      function: [],
      applicationArea: [],
      region: [],
      certification: [],
      status: [],
      catalogueUpdatedAt: lastRun?.finishedAt ?? null,
    };
    for (const row of universe) {
      result[row.facet].push({
        value: row.value,
        count: counts[row.facet].get(row.value) ?? 0,
      });
    }
    // Status: lifecycle order (Active → Phase-out → Discontinued).
    result.status = Object.values(ProductStatus).map((value) => ({
      value,
      count: counts.status.get(value) ?? 0,
    }));

    const byValue = (a: FacetValueDto, b: FacetValueDto) =>
      a.value.localeCompare(b.value);
    result.function.sort(byValue);
    result.applicationArea.sort(byValue);
    result.region.sort(byValue);
    result.certification.sort(byValue);
    return result;
  }
}
