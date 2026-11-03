import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { getErrorMessage } from '../../core/api/api-error';
import { CatalogueApi } from '../../core/api/catalogue-api';
import { Review } from '../../core/api/catalogue.models';
import { RatingStars } from '../../shared/ui/rating-stars';
import { ReviewForm } from './review-form';

const PAGE_SIZE = 5;

@Component({
  selector: 'app-reviews-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, ButtonModule, SkeletonModule, RatingStars, ReviewForm],
  templateUrl: './reviews-section.html',
  styleUrl: './reviews-section.scss',
})
export class ReviewsSection {
  readonly sku = input.required<string>();
  readonly created = output<Review>();

  private readonly api = inject(CatalogueApi);

  protected readonly firstPage = rxResource({
    params: () => this.sku(),
    stream: ({ params }) => this.api.reviews(params, 1, PAGE_SIZE),
  });

  private readonly morePages = signal<Review[]>([]);
  private readonly nextPage = signal(2);
  protected readonly loadingMore = signal(false);
  protected readonly loadMoreError = signal<string | null>(null);
  protected readonly formOpen = signal(false);
  protected readonly justPosted = signal(false);

  protected readonly summary = computed(() =>
    this.firstPage.hasValue() ? this.firstPage.value() : undefined,
  );
  protected readonly items = computed(() => [...(this.summary()?.items ?? []), ...this.morePages()]);
  protected readonly hasMore = computed(() => {
    const s = this.summary();
    return !!s && this.items().length < s.total;
  });
  /** 5★ first, as percentages of all reviews. */
  protected readonly bars = computed(() => {
    const s = this.summary();
    if (!s || s.total === 0) return [];
    return [5, 4, 3, 2, 1].map((stars) => {
      const count = s.distribution[stars - 1] ?? 0;
      return { stars, count, pct: Math.round((count / s.total) * 100) };
    });
  });
  protected readonly errorMessage = computed(() => getErrorMessage(this.firstPage.error()));

  protected loadMore(): void {
    this.loadingMore.set(true);
    this.loadMoreError.set(null);
    this.api.reviews(this.sku(), this.nextPage(), PAGE_SIZE).subscribe({
      next: (page) => {
        this.morePages.update((items) => [...items, ...page.items]);
        this.nextPage.update((n) => n + 1);
        this.loadingMore.set(false);
      },
      error: (err: unknown) => {
        this.loadMoreError.set(getErrorMessage(err));
        this.loadingMore.set(false);
      },
    });
  }

  protected openForm(): void {
    this.justPosted.set(false);
    this.formOpen.set(true);
  }

  protected onPosted(review: Review): void {
    this.formOpen.set(false);
    this.justPosted.set(true);
    this.morePages.set([]);
    this.nextPage.set(2);
    this.firstPage.reload();
    this.created.emit(review);
  }
}
