/** Mirrors the backend DTOs (backend/src/products/dto, backend/src/reviews/dto). */

export type ProductStatus = 'ACTIVE' | 'PHASE_OUT' | 'DISCONTINUED';

export type ProductSort = 'name' | '-name' | 'newest' | 'rating';

export interface ProductSummary {
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
  ratingAvg: number | null;
  ratingCount: number;
}

export interface ProductDetail extends ProductSummary {
  /** false = no longer in the PIM export (old link). */
  listed: boolean;
}

export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface FacetValue {
  value: string;
  count: number;
}

export interface ProductFacets {
  function: FacetValue[];
  applicationArea: FacetValue[];
  region: FacetValue[];
  certification: FacetValue[];
  status: FacetValue[];
  catalogueUpdatedAt: string | null;
}

/** Query sent to GET /api/products. */
export interface ProductListParams {
  q?: string;
  function?: string[];
  applicationArea?: string[];
  region?: string[];
  certification?: string[];
  status?: ProductStatus[];
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
}

export interface Review {
  id: string;
  rating: number;
  authorName: string;
  company: string | null;
  comment: string;
  createdAt: string;
}

export interface ReviewPage extends Page<Review> {
  ratingAvg: number | null;
  ratingCount: number;
  /** Count per star, index 0 = 1 star. */
  distribution: number[];
}

export interface CreateReview {
  rating: number;
  authorName: string;
  company?: string;
  comment: string;
  /** Honeypot — always empty for humans. */
  website?: string;
}
