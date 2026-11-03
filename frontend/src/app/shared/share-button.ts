import { ChangeDetectionStrategy, Component, DOCUMENT, inject, input, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';

/**
 * "Send a colleague a link to exactly what I'm looking at."
 * On phones the native share sheet (Web Share API) — WhatsApp, Mail, Teams —
 * elsewhere copy-to-clipboard with inline confirmation.
 */
@Component({
  selector: 'app-share-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonModule],
  template: `
    <p-button
      [label]="iconOnly() ? undefined : copied() ? 'Link copied' : label()"
      [ariaLabel]="copied() ? 'Link copied' : label()"
      [icon]="copied() ? 'pi pi-check' : 'pi pi-share-alt'"
      severity="secondary"
      [outlined]="true"
      [size]="iconOnly() ? undefined : 'small'"
      (onClick)="share()"
    />
    <span class="sr-only" aria-live="polite">{{ copied() ? 'Link copied to clipboard' : '' }}</span>
  `,
})
export class ShareButton {
  readonly title = input<string>('Product Finder');
  readonly label = input<string>('Share');
  /** Icon-only (narrow toolbars); the label stays as the accessible name. */
  readonly iconOnly = input(false);

  private readonly document = inject(DOCUMENT);
  protected readonly copied = signal(false);
  private resetTimer?: ReturnType<typeof setTimeout>;

  async share(): Promise<void> {
    const url = this.document.location.href;
    const nav = this.document.defaultView?.navigator;
    const isTouch = this.document.defaultView?.matchMedia?.('(pointer: coarse)').matches;

    if (nav?.share && isTouch) {
      try {
        await nav.share({ title: this.title(), url });
        return;
      } catch (err) {
        if ((err as DOMException)?.name === 'AbortError') return; // user closed the sheet
      }
    }
    try {
      await nav?.clipboard.writeText(url);
      this.copied.set(true);
      clearTimeout(this.resetTimer);
      this.resetTimer = setTimeout(() => this.copied.set(false), 2000);
    } catch {
      this.document.defaultView?.prompt('Copy this link', url);
    }
  }
}
