import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { ApiError } from './api-error';

/** NestJS error body: `message` is a string, or string[] from ValidationPipe. */
interface NestErrorBody {
  message?: string | string[];
  error?: string;
  code?: string;
}

export function toApiError(res: HttpErrorResponse): ApiError {
  const body = (typeof res.error === 'object' && res.error !== null ? res.error : {}) as NestErrorBody;
  const message = Array.isArray(body.message)
    ? body.message.join(', ')
    : body.message || body.error || `Request failed (${res.status})`;
  return new ApiError(message, res.status, typeof body.code === 'string' ? body.code : undefined);
}

export const apiErrorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((err: unknown) =>
      throwError(() => (err instanceof HttpErrorResponse ? toApiError(err) : err)),
    ),
  );
