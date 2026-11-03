import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

type Star = 'full' | 'half' | 'empty';

/** Read-only star display. Input is rounded to the nearest half star. */
@Component({
  selector: 'app-rating-stars',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="stars" role="img" [attr.aria-label]="label()" [class.lg]="size() === 'lg'">
      @for (star of stars(); track $index) {
        <i
          aria-hidden="true"
          class="pi"
          [class.pi-star-fill]="star === 'full'"
          [class.pi-star-half-fill]="star === 'half'"
          [class.pi-star]="star === 'empty'"
          [class.on]="star !== 'empty'"
        ></i>
      }
    </span>
  `,
  styles: `
    .stars {
      display: inline-flex;
      gap: 0.125rem;
      font-size: 0.8125rem;
      color: var(--star-empty);
    }
    .stars.lg {
      font-size: 1.125rem;
      gap: 0.1875rem;
    }
    .on {
      color: var(--star);
    }
  `,
})
export class RatingStars {
  readonly value = input<number | null>(null);
  readonly size = input<'sm' | 'lg'>('sm');

  protected readonly stars = computed<Star[]>(() => {
    const rounded = Math.round((this.value() ?? 0) * 2) / 2;
    return [1, 2, 3, 4, 5].map((i) =>
      rounded >= i ? 'full' : rounded >= i - 0.5 ? 'half' : 'empty',
    );
  });

  protected readonly label = computed(() => {
    const v = this.value();
    return v === null ? 'Not rated yet' : `Rated ${v.toFixed(1)} out of 5`;
  });
}
