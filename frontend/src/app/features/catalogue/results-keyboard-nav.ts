import { Directive, ElementRef, inject, input } from '@angular/core';

/** Rows this directive navigates: real links, so Enter opens them natively. */
export const RESULT_ROW_SELECTOR = 'a[data-result-row]';

/**
 * Linear-style keyboard flow for a result list:
 *   /        focus the search field (when not already typing)
 *   ↓ / ↑    move from search into the rows and between rows
 *   Esc      from a row, back to search
 * Rows are focused (not just highlighted), so screen readers announce them.
 */
@Directive({
  selector: '[appResultsKeyboardNav]',
  host: { '(document:keydown)': 'onKeydown($event)' },
})
export class ResultsKeyboardNav {
  readonly searchInput = input.required<HTMLInputElement>();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  onKeydown(event: KeyboardEvent): void {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
    const target = event.target as HTMLElement | null;
    const search = this.searchInput();
    const typing =
      !!target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));

    if (event.key === '/' && !typing) {
      event.preventDefault();
      search.focus();
      search.select();
      return;
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp' && event.key !== 'Escape') return;

    const rows = Array.from(
      this.host.nativeElement.querySelectorAll<HTMLAnchorElement>(RESULT_ROW_SELECTOR),
    );
    const index = rows.indexOf(target as HTMLAnchorElement);

    if (event.key === 'Escape') {
      if (index < 0) return;
      event.preventDefault();
      search.focus();
      return;
    }
    if (typing && target !== search) return; // don't hijack arrows in other inputs

    if (event.key === 'ArrowDown') {
      const next = target === search ? rows[0] : rows[index + 1];
      if (!next) return;
      event.preventDefault();
      next.focus();
    } else if (index >= 0) {
      event.preventDefault();
      (index === 0 ? search : rows[index - 1]).focus();
    }
  }
}
