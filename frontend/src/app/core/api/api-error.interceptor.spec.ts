import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { ApiError, getErrorMessage } from './api-error';
import { apiErrorInterceptor } from './api-error.interceptor';

describe('apiErrorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  async function failWith(body: unknown, status: number): Promise<ApiError> {
    const pending = firstValueFrom(http.get('/api/x'));
    httpMock.expectOne('/api/x').flush(body, { status, statusText: 'Error' });
    return pending.then(
      () => {
        throw new Error('expected request to fail');
      },
      (e: unknown) => e as ApiError,
    );
  }

  it('joins NestJS validation messages', async () => {
    const err = await failWith({ message: ['rating must be >= 1', 'title is required'] }, 400);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(400);
    expect(err.message).toBe('rating must be >= 1, title is required');
  });

  it('keeps a single string message and code', async () => {
    const err = await failWith({ message: 'Product not found', code: 'NOT_FOUND' }, 404);
    expect(err.message).toBe('Product not found');
    expect(err.code).toBe('NOT_FOUND');
  });

  it('hides server internals behind a generic message for 5xx', async () => {
    const err = await failWith({ message: 'PrismaClientKnownRequestError…' }, 500);
    expect(getErrorMessage(err)).toBe('The server is currently unavailable. Please try again shortly.');
  });
});
