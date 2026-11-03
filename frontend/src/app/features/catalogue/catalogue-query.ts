import { Params } from '@angular/router';
import { ProductListParams, ProductSort, ProductStatus } from '../../core/api/catalogue.models';

/**
 * Everything the customer sees on the catalogue page, as it lives in the URL.
 * The URL is the single source of truth: sharing a link reproduces the view.
 */
export interface CatalogueQuery {
  q: string;
  function: string[];
  applicationArea: string[];
  region: string[];
  certification: string[];
  includeDiscontinued: boolean;
  sort: ProductSort;
  page: number;
}

export type FacetKey = 'function' | 'applicationArea' | 'region' | 'certification';
export const FACET_KEYS: FacetKey[] = ['function', 'applicationArea', 'region', 'certification'];

export const PAGE_SIZE = 20;
/** Same bounds the API validates (ListProductsQuery) — a link can never 400. */
const MAX_PAGE = 10_000;
const MAX_VALUES = 20;
const MAX_VALUE_LENGTH = 100;
const SORTS: ProductSort[] = ['name', '-name', 'newest', 'rating'];
const DEFAULT_SORT: ProductSort = 'name';

export const EMPTY_QUERY: CatalogueQuery = {
  q: '',
  function: [],
  applicationArea: [],
  region: [],
  certification: [],
  includeDiscontinued: false,
  sort: DEFAULT_SORT,
  page: 1,
};

function list(value: unknown): string[] {
  if (value === undefined || value === null) return [];
  const values = (Array.isArray(value) ? value : [value]) as unknown[];
  return [...new Set(values.map((v) => String(v).trim()).filter(Boolean))]
    .filter((v) => v.length <= MAX_VALUE_LENGTH)
    .slice(0, MAX_VALUES);
}

/** Tolerant parse: a hand-edited or outdated link degrades to defaults, never errors. */
export function parseCatalogueQuery(params: Params): CatalogueQuery {
  const sort = SORTS.includes(params['sort']) ? (params['sort'] as ProductSort) : DEFAULT_SORT;
  const page = Number.parseInt(String(params['page'] ?? '1'), 10);
  return {
    q: typeof params['q'] === 'string' ? params['q'].trim().slice(0, 100) : '',
    function: list(params['function']),
    applicationArea: list(params['applicationArea']),
    region: list(params['region']),
    certification: list(params['certification']),
    includeDiscontinued: params['discontinued'] === '1',
    sort,
    page: Number.isFinite(page) && page > 0 ? Math.min(page, MAX_PAGE) : 1,
  };
}

/** Minimal URL: defaults are omitted so shared links stay short and stable. */
export function toQueryParams(query: CatalogueQuery): Params {
  const params: Params = {};
  if (query.q) params['q'] = query.q;
  for (const key of FACET_KEYS) {
    if (query[key].length) params[key] = query[key];
  }
  if (query.includeDiscontinued) params['discontinued'] = '1';
  if (query.sort !== DEFAULT_SORT) params['sort'] = query.sort;
  if (query.page > 1) params['page'] = String(query.page);
  return params;
}

export function toListParams(query: CatalogueQuery): ProductListParams {
  const status: ProductStatus[] | undefined = query.includeDiscontinued
    ? ['ACTIVE', 'PHASE_OUT', 'DISCONTINUED']
    : undefined;
  return {
    q: query.q || undefined,
    function: query.function,
    applicationArea: query.applicationArea,
    region: query.region,
    certification: query.certification,
    status,
    sort: query.sort,
    page: query.page,
    pageSize: PAGE_SIZE,
  };
}

/** Number of narrowing choices (for the "Filters (n)" button). Search and sort excluded. */
export function activeFilterCount(query: CatalogueQuery): number {
  return FACET_KEYS.reduce((n, key) => n + query[key].length, query.includeDiscontinued ? 1 : 0);
}

/** Any change to what is searched resets to page 1; only paging keeps the page. */
export function withChange(query: CatalogueQuery, change: Partial<CatalogueQuery>): CatalogueQuery {
  return { ...query, page: 1, ...change };
}
