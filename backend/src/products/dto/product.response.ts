import { ProductStatus } from '@prisma/client';

export class ProductSummaryDto {
  sku: string;
  name: string;
  chemicalName: string;
  function: string;
  applicationArea: string;
  region: string;
  certifications: string[];
  status: ProductStatus;
  launchYear: number | null;
  description: string;
  /** Average rating 1–5 rounded to 2 decimals; null when there are no reviews. */
  ratingAvg: number | null;
  ratingCount: number;
}

export class ProductDetailDto extends ProductSummaryDto {
  /**
   * false = the product is no longer in the PIM export. Old shared links
   * still resolve so the UI can say "no longer offered" instead of a 404.
   */
  listed: boolean;
}

export class ProductListDto {
  items: ProductSummaryDto[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export class FacetValueDto {
  value: string;
  count: number;
}

export class ProductFacetsDto {
  function: FacetValueDto[];
  applicationArea: FacetValueDto[];
  region: FacetValueDto[];
  certification: FacetValueDto[];
  status: FacetValueDto[];
  /** Finish time of the last successful PIM import — "data as of". */
  catalogueUpdatedAt: Date | null;
}
