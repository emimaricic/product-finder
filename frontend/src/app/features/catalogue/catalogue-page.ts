import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  computed,
  effect,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { map } from 'rxjs';
import { CatalogueApi } from '../../core/api/catalogue-api';
import { getErrorMessage } from '../../core/api/api-error';
import { ProductFacets, ProductSort } from '../../core/api/catalogue.models';
import { CatalogueContext } from '../../core/catalogue-context';
import { ShareButton } from '../../shared/share-button';
import {
  activeFilterCount,
  CatalogueQuery,
  EMPTY_QUERY,
  FACET_KEYS,
  FacetKey,
  PAGE_SIZE,
  parseCatalogueQuery,
  toListParams,
  toQueryParams,
  withChange,
} from './catalogue-query';
import { FilterPanel } from './filter-panel';
import { FunctionSpectrum } from './function-spectrum';
import { ProductRow } from './product-row';
import { ResultsKeyboardNav } from './results-keyboard-nav';

const SEARCH_DEBOUNCE_MS = 300;

interface ActiveChip {
  key: FacetKey | 'includeDiscontinued';
  value: string;
  label: string;
}

@Component({
  selector: 'app-catalogue-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ButtonModule,
    DrawerModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    PaginatorModule,
    SelectModule,
    SkeletonModule,
    FilterPanel,
    ProductRow,
    ShareButton,
    FunctionSpectrum,
    ResultsKeyboardNav,
  ],
  templateUrl: './catalogue-page.html',
  styleUrl: './catalogue-page.scss',
})
export class CataloguePage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(CatalogueApi);
  private readonly document = inject(DOCUMENT);
  protected readonly context = inject(CatalogueContext);

  /** The URL is the state. Everything below derives from it. */
  protected readonly query = toSignal(this.route.queryParams.pipe(map(parseCatalogueQuery)), {
    initialValue: parseCatalogueQuery(this.route.snapshot.queryParams),
  });

  protected readonly products = rxResource({
    params: () => toListParams(this.query()),
    stream: ({ params }) => this.api.listProducts(params),
  });

  /** Cross-filtered facet counts for the current search (page/sort irrelevant). */
  private readonly facetsResource = rxResource({
    params: () => ({ ...toListParams(this.query()), page: undefined, sort: undefined, pageSize: undefined }),
    stream: ({ params }) => this.api.facets(params),
  });

  /** Last good facets, kept while the next counts load; falls back to the catalogue-wide ones. */
  protected readonly facets = linkedSignal<ProductFacets | undefined, ProductFacets | undefined>({
    source: () => (this.facetsResource.hasValue() ? this.facetsResource.value() : undefined),
    computation: (next, previous) => next ?? previous?.value ?? this.context.facets(),
  });

  /** Keep the previous page on screen while the next one loads (no flash of skeletons). */
  protected readonly shown = linkedSignal<
    ReturnType<typeof this.products.value>,
    ReturnType<typeof this.products.value>
  >({
    source: () => (this.products.hasValue() ? this.products.value() : undefined),
    computation: (next, previous) => next ?? previous?.value,
  });

  /**
   * Input text follows the URL (back/forward, shared links), except when the
   * URL merely caught up with what is typed: "sodium " stays "sodium ".
   */
  protected readonly searchText = linkedSignal<string, string>({
    source: () => this.query().q,
    computation: (q, previous) => (previous && previous.value.trim() === q ? previous.value : q),
  });
  protected readonly filtersOpen = signal(false);
  protected readonly filterCount = computed(() => activeFilterCount(this.query()));
  protected readonly pageSize = PAGE_SIZE;

  protected readonly sortOptions: { label: string; value: ProductSort }[] = [
    { label: 'Name A–Z', value: 'name' },
    { label: 'Name Z–A', value: '-name' },
    { label: 'Newest launch', value: 'newest' },
    { label: 'Top rated', value: 'rating' },
  ];

  protected readonly chips = computed<ActiveChip[]>(() => {
    const q = this.query();
    const chips: ActiveChip[] = FACET_KEYS.flatMap((key) =>
      q[key].map((value) => ({ key, value, label: value })),
    );
    if (q.includeDiscontinued) {
      chips.push({ key: 'includeDiscontinued', value: '1', label: 'Incl. discontinued' });
    }
    return chips;
  });

  protected readonly errorMessage = computed(() =>
    this.products.error() ? getErrorMessage(this.products.error()) : null,
  );

  private searchTimer?: ReturnType<typeof setTimeout>;

  /** Sellable = Active + Phase-out, the default view. */
  protected readonly totalSellable = computed(() =>
    (this.context.facets()?.status ?? [])
      .filter((s) => s.value !== 'DISCONTINUED')
      .reduce((n, s) => n + s.count, 0),
  );

  constructor() {
    // Remember the search so "Back to results" on a product page restores it.
    effect(() => this.context.lastSearch.set(toQueryParams(this.query())));

    // A debounced search must not fire after the user has left the page
    // (it would navigate them back from the product they just opened).
    inject(DestroyRef).onDestroy(() => clearTimeout(this.searchTimer));

    // An old link can point past the end once the catalogue shrank.
    effect(() => {
      const result = this.shown();
      if (result && result.totalPages > 0 && this.query().page > result.totalPages) {
        this.update({ page: result.totalPages }, { replaceUrl: true });
      }
    });
  }

  protected onSearchInput(value: string): void {
    this.searchText.set(value);
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(
      () => this.update({ q: value.trim() }, { replaceUrl: true }),
      SEARCH_DEBOUNCE_MS,
    );
  }

  protected clearSearch(): void {
    clearTimeout(this.searchTimer);
    this.searchText.set('');
    this.update({ q: '' });
  }

  protected update(change: Partial<CatalogueQuery>, opts: { replaceUrl?: boolean } = {}): void {
    // A filter/sort change made while a search is still debouncing carries
    // the typed text along instead of dropping it.
    clearTimeout(this.searchTimer);
    const pending = this.searchText().trim();
    if (!('q' in change) && pending !== this.query().q) change = { ...change, q: pending };
    const next = withChange(this.query(), change);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: toQueryParams(next),
      replaceUrl: opts.replaceUrl ?? false,
    });
  }

  protected toggleFunction(value: string): void {
    const current = this.query().function;
    this.update({
      function: current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
    });
  }

  protected removeChip(chip: ActiveChip): void {
    if (chip.key === 'includeDiscontinued') {
      this.update({ includeDiscontinued: false });
    } else {
      this.update({ [chip.key]: this.query()[chip.key].filter((v) => v !== chip.value) });
    }
  }

  protected clearFilters(): void {
    const { q, sort } = this.query();
    this.update({ ...EMPTY_QUERY, q, sort });
  }

  protected onPage(event: PaginatorState): void {
    const page = (event.page ?? 0) + 1;
    if (page === this.query().page) return;
    this.update({ page });
    this.document.defaultView?.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
