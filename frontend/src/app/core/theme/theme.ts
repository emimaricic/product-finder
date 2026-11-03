import { DOCUMENT, Injectable, effect, inject, signal } from '@angular/core';

export type ThemeChoice = 'system' | 'light' | 'dark';
const STORAGE_KEY = 'pf-theme';

/**
 * User-selectable colour scheme. "system" follows prefers-color-scheme;
 * light/dark set data-theme on <html>, which both the SCSS tokens and
 * PrimeNG's light-dark() tokens (via color-scheme) respond to.
 * index.html applies the stored choice before first paint.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  readonly choice = signal<ThemeChoice>(this.read());

  constructor() {
    effect(() => {
      const choice = this.choice();
      const root = this.document.documentElement;
      if (choice === 'system') root.removeAttribute('data-theme');
      else root.setAttribute('data-theme', choice);
      try {
        if (choice === 'system') localStorage.removeItem(STORAGE_KEY);
        else localStorage.setItem(STORAGE_KEY, choice);
      } catch {
        // Storage unavailable (private mode): the choice still applies this session.
      }
    });
  }

  private read(): ThemeChoice {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === 'light' || stored === 'dark' ? stored : 'system';
    } catch {
      return 'system';
    }
  }
}
