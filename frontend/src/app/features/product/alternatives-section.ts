import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { CatalogueApi } from '../../core/api/catalogue-api';
import { Lifecycle } from '../../shared/ui/status-badge';
import { ProductRow } from '../catalogue/product-row';

/**
 * "What should I use instead?" For a product being retired (or gone) this
 * leads with active replacements of the same function; for an active one it
 * offers similar products. Hidden when there is nothing to suggest.
 */
@Component({
  selector: 'app-alternatives-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProductRow],
  template: `
    @if (items().length) {
      <section class="alts" [class.urgent]="retiring()" aria-labelledby="alts-heading">
        <header>
          <h2 id="alts-heading">{{ retiring() ? 'Active alternatives' : 'Similar products' }}</h2>
          <p>
            {{
              retiring()
                ? 'Currently sold products with the same function, closest match first.'
                : 'Same function, ranked by application, region and certifications.'
            }}
          </p>
        </header>
        <ul>
          @for (p of items(); track p.sku) {
            <li><app-product-row [product]="p" /></li>
          }
        </ul>
      </section>
    }
  `,
  styles: `
    .alts {
      background: var(--background);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
      overflow: clip;
    }
    header {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
      padding: 1.25rem var(--gutter) 0.875rem;
      border-bottom: 1px solid var(--border);
    }
    h2 {
      font-size: var(--text-lg);
    }
    header p {
      color: var(--muted-foreground);
    }
    ul {
      margin: 0;
      padding: 0;
      list-style: none;
    }
    li + li {
      border-top: 1px solid var(--border);
    }
    @media (min-width: 768px) {
      header {
        padding: 1.5rem 2rem 1rem;
      }
    }
  `,
})
export class AlternativesSection {
  readonly sku = input.required<string>();
  readonly lifecycle = input.required<Lifecycle>();

  private readonly api = inject(CatalogueApi);
  private readonly resource = rxResource({
    params: () => this.sku(),
    stream: ({ params }) => this.api.alternatives(params),
  });

  protected readonly items = computed(() =>
    this.resource.hasValue() ? (this.resource.value() ?? []) : [],
  );
  protected readonly retiring = computed(() => this.lifecycle() !== 'ACTIVE');
}
