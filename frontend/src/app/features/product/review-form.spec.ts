import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Review } from '../../core/api/catalogue.models';
import { apiErrorInterceptor } from '../../core/api/api-error.interceptor';
import { ReviewForm } from './review-form';

describe('ReviewForm', () => {
  let fixture: ComponentFixture<ReviewForm>;
  let form: ReviewForm;
  let httpMock: HttpTestingController;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewForm],
      providers: [provideHttpClient(withInterceptors([apiErrorInterceptor])), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(ReviewForm);
    fixture.componentRef.setInput('sku', 'P-10001');
    form = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    el = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  afterEach(() => httpMock.verify());

  function fill(values: Record<string, unknown>) {
    (form as unknown as { form: { patchValue(v: object): void } }).form.patchValue(values);
  }

  it('does not submit an incomplete review and shows field errors', async () => {
    form.submit();
    await fixture.whenStable();

    httpMock.expectNone('/api/products/P-10001/reviews');
    const errors = [...el.querySelectorAll('.error')].map((e) => e.textContent?.trim());
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/rating/i),
        expect.stringMatching(/name/i),
        expect.stringMatching(/10 characters/),
      ]),
    );
  });

  it('validates the trimmed text, like the server does', async () => {
    fill({ rating: 4, authorName: 'A ', comment: '   short    ' });
    form.submit();
    await fixture.whenStable();
    httpMock.expectNone('/api/products/P-10001/reviews');
    expect(el.textContent).toContain('Enter your name');
    expect(el.textContent).toMatch(/At least 10 characters/);
  });

  it('posts a trimmed review and emits it', async () => {
    const posted: Review[] = [];
    form.posted.subscribe((r) => posted.push(r));
    fill({ rating: 4, authorName: '  Ana ', company: '', comment: '  Stable emulsions, easy to process. ' });

    form.submit();
    const req = httpMock.expectOne('/api/products/P-10001/reviews');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      rating: 4,
      authorName: 'Ana',
      company: undefined,
      comment: 'Stable emulsions, easy to process.',
      website: undefined,
    });
    req.flush({ id: '1', rating: 4, authorName: 'Ana', company: null, comment: 'x', createdAt: '2026-11-03' });

    expect(posted).toHaveLength(1);
  });

  it('shows a friendly message when rate limited', async () => {
    fill({ rating: 5, authorName: 'Ana', comment: 'Great product for our line.' });
    form.submit();
    httpMock
      .expectOne('/api/products/P-10001/reviews')
      .flush({ message: 'Too many requests' }, { status: 429, statusText: 'Too Many Requests' });
    await fixture.whenStable();

    expect(el.querySelector('[role="alert"]')?.textContent).toContain('Too many requests. Please wait');
  });
});
