/**
 * Normalised API error. Every failed HTTP call surfaces as this type
 * (via apiErrorInterceptor), so components never parse HttpErrorResponse.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    /** HTTP status; 0 = network failure / server unreachable. */
    readonly status: number,
    /** Optional machine-readable code from the backend. */
    readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Human-readable message for any error, safe to show in the UI. */
export function getErrorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (err instanceof ApiError) {
    if (err.status === 0) return 'No connection. Check your network and try again.';
    if (err.status >= 500) return 'The server is currently unavailable. Please try again shortly.';
    if (err.status === 429) return 'Too many requests. Please wait a moment and try again.';
    return err.message || fallback;
  }
  return err instanceof Error && err.message ? err.message : fallback;
}
