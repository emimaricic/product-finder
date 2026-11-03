import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ThemeChoice, ThemeService } from '../../core/theme/theme';

const OPTIONS: { value: ThemeChoice; icon: string; label: string }[] = [
  { value: 'system', icon: 'pi-desktop', label: 'System theme' },
  { value: 'light', icon: 'pi-sun', label: 'Light theme' },
  { value: 'dark', icon: 'pi-moon', label: 'Dark theme' },
];

/** Three-way segmented switch: System · Light · Dark. */
@Component({
  selector: 'app-theme-switch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="switch" role="radiogroup" aria-label="Colour theme">
      @for (o of options; track o.value) {
        <button
          type="button"
          role="radio"
          [attr.aria-checked]="theme.choice() === o.value"
          [attr.aria-label]="o.label"
          [attr.title]="o.label"
          [class.on]="theme.choice() === o.value"
          (click)="theme.choice.set(o.value)"
        >
          <i class="pi" [class]="o.icon" aria-hidden="true"></i>
        </button>
      }
    </div>
  `,
  styles: `
    .switch {
      display: inline-flex;
      gap: 2px;
      padding: 2px;
      border: 1px solid var(--border);
      border-radius: 999px;
      background: var(--background);
    }
    button {
      display: grid;
      place-items: center;
      width: 1.625rem;
      height: 1.625rem;
      padding: 0;
      border: 0;
      border-radius: 999px;
      background: none;
      color: var(--subtle-foreground);
      cursor: pointer;
      transition:
        background-color 150ms var(--ease-out),
        color 150ms var(--ease-out);

      i {
        font-size: 0.75rem;
      }
      &:hover {
        color: var(--foreground);
      }
      &.on {
        background: var(--muted);
        color: var(--foreground);
        box-shadow: inset 0 0 0 1px var(--border);
      }
      @media (pointer: coarse) {
        width: 2rem;
        height: 2rem;
      }
    }
  `,
})
export class ThemeSwitch {
  protected readonly theme = inject(ThemeService);
  protected readonly options = OPTIONS;
}
