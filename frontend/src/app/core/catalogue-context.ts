import { Injectable, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Params } from '@angular/router';
import { CatalogueApi } from './api/catalogue-api';

/**
 * App-wide catalogue context:
 *  - facets (+ "data as of"), loaded once and shared by header and filters
 *  - the last catalogue URL state, so "Back to results" restores the search
 */
@Injectable({ providedIn: 'root' })
export class CatalogueContext {
  private readonly api = inject(CatalogueApi);

  private readonly facetsResource = rxResource({ stream: () => this.api.facets() });

  /**
   * Safe read: ResourceRef.value() throws while the resource is in an error
   * state. Facets are an enhancement — if they fail, the shell and search
   * must still render.
   */
  readonly facets = computed(() =>
    this.facetsResource.hasValue() ? this.facetsResource.value() : undefined,
  );

  readonly lastSearch = signal<Params>({});
}
