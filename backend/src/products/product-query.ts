import { Prisma, ProductStatus } from '@prisma/client';
import type { ListProductsQuery } from './dto/list-products.query';
import { ProductSort } from './product-sort';

export const GLOBAL_REGION = 'Global';

/** What customers see unless they explicitly ask for discontinued products. */
export const DEFAULT_STATUSES: ProductStatus[] = [
  ProductStatus.ACTIVE,
  ProductStatus.PHASE_OUT,
];

const SEARCH_FIELDS = [
  'sku',
  'name',
  'chemicalName',
  'function',
  'applicationArea',
  'description',
] as const;

const MAX_SEARCH_TERMS = 5;

/**
 * Builds the WHERE clause for the catalogue search.
 *  - delisted products never appear in search (only via direct link)
 *  - within one filter values are OR-ed, across filters AND-ed
 *  - certifications are AND-ed: "Vegan + Halal" means both
 *  - every search term must match at least one text field (substring,
 *    case-insensitive → served by the pg_trgm GIN indexes)
 */
export function buildProductWhere(
  query: Pick<
    ListProductsQuery,
    'q' | 'function' | 'applicationArea' | 'region' | 'certification' | 'status'
  >,
): Prisma.ProductWhereInput {
  const and: Prisma.ProductWhereInput[] = [
    { delistedAt: null },
    { status: { in: query.status?.length ? query.status : DEFAULT_STATUSES } },
  ];

  if (query.function?.length) and.push({ function: { in: query.function } });
  if (query.applicationArea?.length) {
    and.push({ applicationArea: { in: query.applicationArea } });
  }
  if (query.region?.length) {
    // A customer filtering for their region can buy global products too.
    const regions = new Set([...query.region, GLOBAL_REGION]);
    and.push({ region: { in: [...regions] } });
  }
  if (query.certification?.length) {
    and.push({ certifications: { hasEvery: query.certification } });
  }

  const terms = (query.q ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, MAX_SEARCH_TERMS);
  for (const term of terms) {
    and.push({
      OR: SEARCH_FIELDS.map((field) => ({
        [field]: { contains: term, mode: 'insensitive' },
      })),
    });
  }

  return { AND: and };
}

/** Always ends with `sku` so pagination is deterministic across pages. */
export function buildProductOrderBy(
  sort: ProductSort,
): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case ProductSort.NAME_DESC:
      return [{ name: 'desc' }, { sku: 'asc' }];
    case ProductSort.NEWEST:
      return [
        { launchYear: { sort: 'desc', nulls: 'last' } },
        { name: 'asc' },
        { sku: 'asc' },
      ];
    case ProductSort.RATING:
      return [
        { ratingAvg: { sort: 'desc', nulls: 'last' } },
        { ratingCount: 'desc' },
        { name: 'asc' },
        { sku: 'asc' },
      ];
    case ProductSort.NAME:
    default:
      return [{ name: 'asc' }, { sku: 'asc' }];
  }
}
