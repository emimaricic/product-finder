import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';
import { SkeletonModule } from 'primeng/skeleton';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { FacetValue, ProductFacets } from '../../core/api/catalogue.models';
import { CatalogueQuery, FacetKey } from './catalogue-query';

interface FacetSection {
  key: FacetKey;
  title: string;
  hint?: string;
}

const SECTIONS: FacetSection[] = [
  { key: 'function', title: 'Function' },
  { key: 'applicationArea', title: 'Application area' },
  { key: 'region', title: 'Region', hint: 'Global products are always included.' },
  { key: 'certification', title: 'Certifications', hint: 'Products must have all selected.' },
];

/** Facet checkboxes. Stateless: reads the query, emits changes; the page owns the URL. */
@Component({
  selector: 'app-filter-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, CheckboxModule, ToggleSwitchModule, SkeletonModule],
  templateUrl: './filter-panel.html',
  styleUrl: './filter-panel.scss',
})
export class FilterPanel {
  readonly facets = input<ProductFacets | undefined>();
  readonly query = input.required<CatalogueQuery>();
  readonly changed = output<Partial<CatalogueQuery>>();
  /** The panel renders twice (sidebar + phone sheet); ids must stay unique per instance. */
  readonly idPrefix = input.required<string>();

  protected readonly sections = SECTIONS;
  protected readonly skeletonRows = [1, 2, 3, 4, 5];

  protected options(key: FacetKey): FacetValue[] {
    const facets = this.facets();
    if (!facets) return [];
    // Keep selected values visible even if they no longer exist in the catalogue
    // (e.g. an old shared link), so they can be unticked.
    const known = facets[key];
    const stale = this.query()[key]
      .filter((v) => !known.some((o) => o.value === v))
      .map((value) => ({ value, count: 0 }));
    return [...known, ...stale];
  }

  protected isChecked(key: FacetKey, value: string): boolean {
    return this.query()[key].includes(value);
  }

  protected toggle(key: FacetKey, value: string, checked: boolean): void {
    const current = this.query()[key];
    const next = checked ? [...current, value] : current.filter((v) => v !== value);
    this.changed.emit({ [key]: next });
  }

  protected discontinuedCount(): number | undefined {
    return this.facets()?.status.find((s) => s.value === 'DISCONTINUED')?.count;
  }

  protected id(key: string, value: string): string {
    return `${this.idPrefix()}-${key}-${value.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`;
  }
}
