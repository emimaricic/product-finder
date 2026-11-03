import { Prisma } from '@prisma/client';
import { ProductSummaryDto } from './dto/product.response';

/** Columns every product list (search, alternatives) returns. */
export const SUMMARY_SELECT = {
  sku: true,
  name: true,
  chemicalName: true,
  function: true,
  applicationArea: true,
  region: true,
  certifications: true,
  status: true,
  launchYear: true,
  description: true,
  ratingAvg: true,
  ratingCount: true,
} satisfies Prisma.ProductSelect;

export type SummaryRow = Prisma.ProductGetPayload<{
  select: typeof SUMMARY_SELECT;
}>;

export function toSummary(row: SummaryRow): ProductSummaryDto {
  return { ...row, ratingAvg: row.ratingAvg?.toNumber() ?? null };
}

export { normalizeSku } from '../common/sku';
