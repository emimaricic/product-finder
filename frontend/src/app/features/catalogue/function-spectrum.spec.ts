import { TestBed } from '@angular/core/testing';
import { FunctionSpectrum } from './function-spectrum';

describe('FunctionSpectrum', () => {
  async function render(selected: string[]) {
    const fixture = TestBed.createComponent(FunctionSpectrum);
    fixture.componentRef.setInput('facet', [
      { value: 'Polymer', count: 25 },
      { value: 'Surfactant', count: 15 },
      { value: 'Solvent', count: 0 },
    ]);
    fixture.componentRef.setInput('selected', selected);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('sizes segments by count and dims functions with no matches', async () => {
    const { el } = await render([]);
    const segs = Array.from(el.querySelectorAll<HTMLButtonElement>('.seg'));
    expect(segs.map((s) => s.style.flexGrow)).toEqual(['25', '15', '0.0001']);
    expect(segs[2].classList).toContain('dim');
    expect(el.querySelector('.spectrum-caption')?.textContent).toContain('Products per function');
  });

  it('explains a selection with counts', async () => {
    const { el } = await render(['Polymer']);
    expect(el.querySelector('.spectrum-caption')?.textContent?.trim()).toBe(
      'Showing Polymer · 25 of 40 products',
    );
    expect(el.querySelector('[aria-pressed="true"]')?.getAttribute('aria-label')).toBe('Polymer, 25 products');
  });

  it('emits the function when a segment is clicked', async () => {
    const { fixture, el } = await render([]);
    const emitted: string[] = [];
    fixture.componentInstance.toggled.subscribe((v) => emitted.push(v));
    el.querySelectorAll<HTMLButtonElement>('.seg')[1].click();
    expect(emitted).toEqual(['Surfactant']);
  });
});
