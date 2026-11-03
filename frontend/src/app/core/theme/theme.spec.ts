import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  function create() {
    const service = TestBed.inject(ThemeService);
    TestBed.tick(); // flush the effect
    return service;
  }

  it('follows the system by default (no data-theme attribute)', () => {
    const theme = create();
    expect(theme.choice()).toBe('system');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  it('applies and remembers an explicit choice', () => {
    const theme = create();
    theme.choice.set('dark');
    TestBed.tick();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('pf-theme')).toBe('dark');
  });

  it('restores the stored choice and clears it when going back to system', () => {
    localStorage.setItem('pf-theme', 'light');
    const theme = create();
    expect(theme.choice()).toBe('light');
    theme.choice.set('system');
    TestBed.tick();
    expect(localStorage.getItem('pf-theme')).toBeNull();
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });
});
