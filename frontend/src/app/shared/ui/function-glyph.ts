import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** PIM function → two-letter code. Matches the codes in product names (Quorin SF 470…). */
const CODES: Record<string, string> = {
  Antioxidant: 'AO',
  Emollient: 'EM',
  Emulsifier: 'EF',
  Polymer: 'PO',
  Preservative: 'PR',
  'Rheology Modifier': 'RM',
  Solvent: 'SV',
  Surfactant: 'SF',
};

export function functionCode(fn: string): string {
  return CODES[fn] ?? fn.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase();
}

/** CSS token key for the hue; unknown functions (new business units) fall back to neutral. */
export function functionHue(fn: string): string {
  return CODES[fn] ? CODES[fn].toLowerCase() : 'xx';
}

/**
 * The function glyph: a small gradient tile carrying the function code.
 * Colour = function, nothing else. `transitionName` lets the same glyph morph
 * between the result row and the product header (View Transitions).
 */
@Component({
  selector: 'app-function-glyph',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.--a]': "'var(--fn-' + hue() + '-a)'",
    '[style.--b]': "'var(--fn-' + hue() + '-b)'",
    '[style.view-transition-name]': 'transitionName() ?? null',
    '[class.lg]': "size() === 'lg'",
    '[attr.title]': 'fn()',
    'aria-hidden': 'true',
  },
  template: `{{ code() }}`,
  styles: `
    :host {
      display: inline-grid;
      place-items: center;
      flex-shrink: 0;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 10px;
      background: linear-gradient(145deg, var(--a), var(--b));
      color: #fff;
      font-family: var(--font-sans);
      font-size: 0.875rem;
      font-weight: 600;
      letter-spacing: -0.03em;
      user-select: none;
    }
    :host(.lg) {
      width: 4rem;
      height: 4rem;
      border-radius: 16px;
      font-size: 1.375rem;
    }
  `,
})
export class FunctionGlyph {
  readonly fn = input.required<string>();
  readonly size = input<'md' | 'lg'>('md');
  readonly transitionName = input<string | undefined>();

  protected readonly code = computed(() => functionCode(this.fn()));
  protected readonly hue = computed(() => functionHue(this.fn()));
}
