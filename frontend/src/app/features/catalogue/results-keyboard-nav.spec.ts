import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ResultsKeyboardNav } from './results-keyboard-nav';

@Component({
  imports: [ResultsKeyboardNav],
  template: `
    <input #search />
    <input class="other" />
    <ul appResultsKeyboardNav [searchInput]="search">
      @for (n of rows(); track n) {
        <li><a href="#" data-result-row>{{ n }}</a></li>
      }
    </ul>
  `,
})
class Host {
  rows = signal([1, 2, 3]);
}

describe('ResultsKeyboardNav', () => {
  let el: HTMLElement;
  const press = (key: string, target: Element = document.activeElement ?? document.body) =>
    target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  const rows = () => Array.from(el.querySelectorAll('a'));

  beforeEach(async () => {
    const fixture = TestBed.createComponent(Host);
    el = fixture.nativeElement as HTMLElement;
    document.body.appendChild(el);
    await fixture.whenStable();
  });

  afterEach(() => el.remove());

  it('"/" focuses the search field when not typing', () => {
    press('/', document.body);
    expect(document.activeElement).toBe(el.querySelector('input'));
  });

  it('walks from search into the rows and back up', () => {
    const search = el.querySelector('input')!;
    search.focus();
    press('ArrowDown');
    expect(document.activeElement).toBe(rows()[0]);
    press('ArrowDown');
    expect(document.activeElement).toBe(rows()[1]);
    press('ArrowUp');
    press('ArrowUp');
    expect(document.activeElement).toBe(search);
  });

  it('Esc in a row returns to search; arrows in other inputs are left alone', () => {
    rows()[2].focus();
    press('Escape');
    expect(document.activeElement).toBe(el.querySelector('input'));

    const other = el.querySelector<HTMLInputElement>('input.other')!;
    other.focus();
    press('ArrowDown');
    expect(document.activeElement).toBe(other);
  });
});
