import { Transform } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/**
 * Reviews are stored as plain text and escaped on render (Angular does this
 * by default), so we don't strip HTML here — we only normalise whitespace and
 * drop control characters that could break layout.
 */
const cleanText = ({ value }: { value: unknown }) =>
  typeof value === 'string'
    ? value
        // eslint-disable-next-line no-control-regex
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
        .replace(/\r\n?/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
    : value;

const cleanLine = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : value;

export class CreateReviewDto {
  @IsInt({ message: 'rating must be a whole number from 1 to 5' })
  @Min(1)
  @Max(5)
  rating: number;

  /** Shown publicly next to the review. */
  @Transform(cleanLine)
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  authorName: string;

  @Transform(cleanLine)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  company?: string;

  @Transform(cleanText)
  @IsString()
  @MinLength(10, { message: 'comment must be at least 10 characters' })
  @MaxLength(2000)
  comment: string;

  /**
   * Honeypot. Hidden in the UI; humans leave it empty, naive bots fill it.
   * Not a security boundary — just cheap noise reduction without a CAPTCHA.
   */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;
}
