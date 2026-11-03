import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CreateReview,
  ProductDetail,
  ProductFacets,
  ProductListParams,
  ProductSummary,
  Page,
  Review,
  ReviewPage,
} from './catalogue.models';

const BASE = '/api/products';

/** Thin typed client. Errors arrive as ApiError via apiErrorInterceptor. */
@Injectable({ providedIn: 'root' })
export class CatalogueApi {
  private readonly http = inject(HttpClient);

  listProducts(params: ProductListParams): Observable<Page<ProductSummary>> {
    return this.http.get<Page<ProductSummary>>(BASE, { params: toHttpParams(params) });
  }

  /** Without params: whole catalogue. With filters: cross-filtered counts. */
  facets(params: ProductListParams = {}): Observable<ProductFacets> {
    return this.http.get<ProductFacets>(`${BASE}/facets`, { params: toHttpParams(params) });
  }

  alternatives(sku: string): Observable<ProductSummary[]> {
    return this.http.get<ProductSummary[]>(`${BASE}/${encodeURIComponent(sku)}/alternatives`);
  }

  product(sku: string): Observable<ProductDetail> {
    return this.http.get<ProductDetail>(`${BASE}/${encodeURIComponent(sku)}`);
  }

  reviews(sku: string, page: number, pageSize = 5): Observable<ReviewPage> {
    return this.http.get<ReviewPage>(`${BASE}/${encodeURIComponent(sku)}/reviews`, {
      params: { page, pageSize },
    });
  }

  createReview(sku: string, body: CreateReview): Observable<Review> {
    return this.http.post<Review>(`${BASE}/${encodeURIComponent(sku)}/reviews`, body);
  }
}

/** Arrays become repeated params (?region=EMEA&region=Global), empties are dropped. */
export function toHttpParams(params: object): HttpParams {
  let http = new HttpParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    for (const v of Array.isArray(value) ? value : [value]) {
      http = http.append(key, String(v));
    }
  }
  return http;
}
