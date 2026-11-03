import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { FacetValue } from '../../core/api/catalogue.models';
import { functionCode, functionHue } from '../../shared/ui/function-glyph';

/**
 * The catalogue mix by function, as a clickable proportional bar.
 *
 * Segment width = number of products with that function that match all the
 * OTHER active filters (cross-filtered facet counts). Selecting a function
 * therefore doesn't resize the bar — it filters the results and dims the rest,
 * which stay clickable to add more functions.
 */
@Component({
  selector: 'app-function-spectrum',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './function-spectrum.html',
  styleUrl: './function-spectrum.scss',
})
export class FunctionSpectrum {
  readonly facet = input.required<FacetValue[]>();
  readonly selected = input.required<string[]>();
  readonly toggled = output<string>();

  protected readonly hovered = signal<string | null>(null);

  protected readonly segments = computed(() => {
    const selected = this.selected();
    return this.facet().map((f) => ({
      value: f.value,
      count: f.count,
      code: functionCode(f.value),
      hue: functionHue(f.value),
      selected: selected.includes(f.value),
      dimmed: (selected.length > 0 && !selected.includes(f.value)) || f.count === 0,
    }));
  });

  /** Products across all functions = results under the other filters (one function each). */
  private readonly total = computed(() => this.facet().reduce((n, f) => n + f.count, 0));

  /** Always says what the widths mean; decodes the bar on touch screens too. */
  protected readonly caption = computed(() => {
    const segs = this.segments();
    const hovered = segs.find((s) => s.value === this.hovered());
    if (hovered) return `${hovered.value} · ${hovered.count} of ${this.total()} products`;
    const selected = segs.filter((s) => s.selected);
    if (selected.length) {
      const n = selected.reduce((sum, s) => sum + s.count, 0);
      return `Showing ${selected.map((s) => s.value).join(', ')} · ${n} of ${this.total()} products`;
    }
    return 'Products per function for your current filters. Tap a segment to filter.';
  });
}
