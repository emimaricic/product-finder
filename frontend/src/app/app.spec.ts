import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { apiErrorInterceptor } from './core/api/api-error.interceptor';

describe('App shell', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
  });

  // Not whenStable(): zoneless stability waits for the pending facets request,
  // which only resolves when the test flushes it.
  async function render() {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    return fixture;
  }

  it('shows when the catalogue data was last imported', async () => {
    const fixture = await render();
    httpMock.expectOne('/api/products/facets').flush({
      function: [], applicationArea: [], region: [], certification: [], status: [],
      catalogueUpdatedAt: '2026-11-03T02:00:00Z',
    });
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('a.brand')?.textContent).toContain('Product Finder');
    expect(el.querySelector('.freshness time')?.textContent).toContain('3 Nov 2026');
  });

  it('still renders when facets fail (freshness is an enhancement)', async () => {
    const fixture = await render();
    httpMock.expectOne('/api/products/facets').flush(null, { status: 500, statusText: 'Error' });
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('a.brand')).not.toBeNull();
    expect(el.querySelector('.freshness')).toBeNull();
  });
});
