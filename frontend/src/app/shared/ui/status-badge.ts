import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ProductStatus } from '../../core/api/catalogue.models';

export type Lifecycle = ProductStatus | 'DELISTED';

export const LIFECYCLE_LABEL: Record<Lifecycle, string> = {
  ACTIVE: 'Active',
  PHASE_OUT: 'Phase-out',
  DISCONTINUED: 'Discontinued',
  DELISTED: 'No longer offered',
};

/** The lifecycle vocabulary — same colour and words in rows, data sheet and banners. */
@Component({
  selector: 'app-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="badge" [attr.data-status]="status()">{{ label() }}</span>`,
  styles: `
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.0625rem 0.5rem;
      border-radius: 999px;
      font-size: var(--text-xs);
      font-weight: 500;
      line-height: 1.25rem;
      white-space: nowrap;
      color: var(--c);
      background: var(--bg);
      box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c) 18%, transparent);
    }
    .badge::before {
      content: '';
      width: 0.375rem;
      height: 0.375rem;
      border-radius: 50%;
      background: currentColor;
    }
    [data-status='ACTIVE'] { --c: var(--status-active); --bg: var(--status-active-bg); }
    [data-status='PHASE_OUT'] { --c: var(--status-phase-out); --bg: var(--status-phase-out-bg); }
    [data-status='DISCONTINUED'] { --c: var(--status-discontinued); --bg: var(--status-discontinued-bg); }
    [data-status='DELISTED'] { --c: var(--status-delisted); --bg: var(--status-delisted-bg); }
  `,
})
export class StatusBadge {
  readonly status = input.required<Lifecycle>();
  protected readonly label = computed(() => LIFECYCLE_LABEL[this.status()]);
}
