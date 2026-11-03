import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { RatingModule } from 'primeng/rating';
import { TextareaModule } from 'primeng/textarea';
import { getErrorMessage } from '../../core/api/api-error';
import { CatalogueApi } from '../../core/api/catalogue-api';
import { Review } from '../../core/api/catalogue.models';

/**
 * Same limits as the backend DTO (CreateReviewDto), which validates the
 * TRIMMED value — so the form does too ("A " must fail here, not as a 400).
 * Next step: generate these from the OpenAPI spec instead of copying.
 */
export const REVIEW_LIMITS = { nameMin: 2, nameMax: 80, companyMax: 120, commentMin: 10, commentMax: 2000 };

/**
 * Typed reactive form — Angular's counterpart of react-hook-form + zod:
 * validators declared once, errors read per control, submit guarded by validity.
 */
function trimmedLength(min: number, max: number): ValidatorFn {
  return (control: AbstractControl<string>): ValidationErrors | null => {
    const length = (control.value ?? '').trim().length;
    if (length === 0) return null; // "required" reports emptiness
    return length < min || length > max ? { trimmedLength: { min, max, actual: length } } : null;
  };
}

const requiredTrimmed: ValidatorFn = (control: AbstractControl<string>) =>
  (control.value ?? '').trim() ? null : { required: true };

@Component({
  selector: 'app-review-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ButtonModule, InputTextModule, RatingModule, TextareaModule],
  templateUrl: './review-form.html',
  styleUrl: './review-form.scss',
})
export class ReviewForm {
  readonly sku = input.required<string>();
  readonly posted = output<Review>();
  readonly cancelled = output<void>();

  private readonly api = inject(CatalogueApi);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly limits = REVIEW_LIMITS;

  protected readonly form = inject(NonNullableFormBuilder).group({
    rating: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
    authorName: ['', [requiredTrimmed, trimmedLength(REVIEW_LIMITS.nameMin, REVIEW_LIMITS.nameMax)]],
    company: ['', [trimmedLength(0, REVIEW_LIMITS.companyMax)]],
    comment: ['', [requiredTrimmed, trimmedLength(REVIEW_LIMITS.commentMin, REVIEW_LIMITS.commentMax)]],
    website: [''], // honeypot
  });

  protected readonly commentLength = toSignal(this.form.controls.comment.valueChanges, { initialValue: '' });
  protected readonly submitting = signal(false);
  protected readonly serverError = signal<string | null>(null);

  protected showError(name: 'rating' | 'authorName' | 'company' | 'comment'): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || control.dirty);
  }

  submit(): void {
    this.serverError.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      // Bring the first problem into view; focus the first invalid text field.
      // (Focusing p-rating would render its first star as if selected.)
      const root = this.host.nativeElement;
      root.querySelector('h3')?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
      root.querySelector<HTMLElement>('input.ng-invalid, textarea.ng-invalid')?.focus({ preventScroll: true });
      return;
    }

    const { rating, authorName, company, comment, website } = this.form.getRawValue();
    this.submitting.set(true);
    this.api
      .createReview(this.sku(), {
        rating,
        authorName: authorName.trim(),
        company: company.trim() || undefined,
        comment: comment.trim(),
        website: website || undefined,
      })
      .subscribe({
        next: (review) => {
          this.submitting.set(false);
          this.form.reset();
          this.posted.emit(review);
        },
        error: (err: unknown) => {
          this.submitting.set(false);
          this.serverError.set(getErrorMessage(err));
        },
      });
  }
}
