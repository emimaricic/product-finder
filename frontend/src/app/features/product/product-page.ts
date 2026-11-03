import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { ApiError, getErrorMessage } from '../../core/api/api-error';
import { CatalogueApi } from '../../core/api/catalogue-api';
import { ProductDetail } from '../../core/api/catalogue.models';
import { CatalogueContext } from '../../core/catalogue-context';
import { ShareButton } from '../../shared/share-button';
import { FunctionGlyph, functionHue } from '../../shared/ui/function-glyph';
import { Lifecycle, StatusBadge } from '../../shared/ui/status-badge';
import { AlternativesSection } from './alternatives-section';
import { ReviewsSection } from './reviews-section';

interface Notice {
  tone: Lifecycle;
  title: string;
  body: string;
}

export function lifecycleOf(product: ProductDetail): Lifecycle {
  return product.listed ? product.status : 'DELISTED';
}

/** Factual lifecycle notices only — no promises about stock or successors. */
export function noticeFor(product: ProductDetail): Notice | null {
  switch (lifecycleOf(product)) {
    case 'DELISTED':
      return {
        tone: 'DELISTED',
        title: 'No longer offered',
        body: 'This product is no longer in our catalogue. The information below may be out of date.',
      };
    case 'DISCONTINUED':
      return {
        tone: 'DISCONTINUED',
        title: 'Discontinued',
        body: 'This product is no longer sold. It is shown for reference only.',
      };
    case 'PHASE_OUT':
      return {
        tone: 'PHASE_OUT',
        title: 'Being phased out',
        body: 'This product is still sold but will be discontinued. Consider this before starting new work with it.',
      };
    default:
      return null;
  }
}

@Component({
  selector: 'app-product-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ButtonModule,
    SkeletonModule,
    ShareButton,
    StatusBadge,
    ReviewsSection,
    FunctionGlyph,
    AlternativesSection,
  ],
  templateUrl: './product-page.html',
  styleUrl: './product-page.scss',
})
export class ProductPage {
  /** Route param, bound via withComponentInputBinding(). */
  readonly sku = input.required<string>();

  private readonly api = inject(CatalogueApi);
  private readonly title = inject(Title);
  protected readonly context = inject(CatalogueContext);

  protected readonly product = rxResource({
    params: () => this.sku(),
    stream: ({ params }) => this.api.product(params),
  });

  protected readonly notFound = computed(() => {
    const err = this.product.error();
    return err instanceof ApiError && err.status === 404;
  });
  protected readonly errorMessage = computed(() => getErrorMessage(this.product.error()));

  protected readonly detail = computed(() =>
    this.product.hasValue() ? this.product.value() : undefined,
  );
  protected readonly lifecycle = computed(() => {
    const p = this.detail();
    return p ? lifecycleOf(p) : null;
  });
  protected readonly hue = computed(() => functionHue(this.detail()?.function ?? ''));
  protected readonly notice = computed(() => {
    const p = this.detail();
    return p ? noticeFor(p) : null;
  });

  constructor() {
    effect(() => {
      const p = this.detail();
      if (p) this.title.setTitle(`${p.name} (${p.sku}) · Product Finder`);
    });
  }

  /** Reviews changed the aggregates; refresh the header rating quietly. */
  protected onReviewCreated(): void {
    this.product.reload();
  }
}
