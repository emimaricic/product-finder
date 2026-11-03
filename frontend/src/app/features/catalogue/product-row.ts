import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductSummary } from '../../core/api/catalogue.models';
import { FunctionGlyph } from '../../shared/ui/function-glyph';
import { RatingStars } from '../../shared/ui/rating-stars';
import { StatusBadge } from '../../shared/ui/status-badge';

/**
 * One search result. Dense on purpose: experts scan chemistry, function and
 * certifications. The glyph carries a view-transition-name so it morphs into
 * the product header on navigation.
 */
@Component({
  selector: 'app-product-row',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, StatusBadge, RatingStars, FunctionGlyph],
  template: `
    @let p = product();
    <a class="row" [routerLink]="['/products', p.sku]" data-result-row>
      <app-function-glyph [fn]="p.function" [transitionName]="'glyph-' + p.sku" />

      <div class="main">
        <div class="title">
          <h3 class="name">{{ p.name }}</h3>
          @if (p.status !== 'ACTIVE') {
            <app-status-badge [status]="p.status" />
          }
        </div>
        <p class="chem" [title]="p.chemicalName"><span class="mono sku">{{ p.sku }}</span>{{ p.chemicalName }}</p>
      </div>

      <p class="meta">
        <span class="fn">{{ p.function }}</span>
        <span>{{ p.applicationArea }} · {{ p.region }}</span>
      </p>

      <div class="certs-col">
        @if (p.certifications.length) {
          @let certs = p.certifications;
          <!-- Phones show two chips, the table layout one; "+N" adapts. Screen readers get the full list. -->
          <ul class="certs" aria-hidden="true" [title]="certs.join(', ')">
            @for (cert of certs.slice(0, 2); track cert) {
              <li [class.second]="$index === 1">{{ cert }}</li>
            }
            @if (certs.length > 1) {
              <li class="more more-wide">+{{ certs.length - 1 }}</li>
            }
            @if (certs.length > 2) {
              <li class="more more-narrow">+{{ certs.length - 2 }}</li>
            }
          </ul>
          <span class="sr-only">Certifications: {{ certs.join(', ') }}</span>
        }
      </div>

      <span class="rating">
        @if (p.ratingCount > 0) {
          <app-rating-stars [value]="p.ratingAvg" />
          <span class="tabular">{{ p.ratingAvg?.toFixed(1) }}<span class="n">({{ p.ratingCount }})</span></span>
        } @else {
          <span class="unrated">No reviews</span>
        }
      </span>

      <i class="pi pi-arrow-right go" aria-hidden="true"></i>
    </a>
  `,
  styleUrl: './product-row.scss',
})
export class ProductRow {
  readonly product = input.required<ProductSummary>();
}
