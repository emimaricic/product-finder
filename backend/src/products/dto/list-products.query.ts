import { ProductStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ProductSort } from '../product-sort';

export { ProductSort };

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/**
 * Multi-value filters arrive as repeated params (?region=EMEA&region=Global).
 * Express gives a string for one value and an array for several — normalise.
 */
const toArray = ({ value }: { value: unknown }): string[] | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  const values = (Array.isArray(value) ? value : [value]) as unknown[];
  return values.map((v) => String(v).trim()).filter(Boolean);
};

const MultiValue = () => (target: object, key: string) => {
  Transform(toArray)(target, key);
  IsOptional()(target, key);
  IsString({ each: true })(target, key);
  ArrayMaxSize(20)(target, key);
  MaxLength(100, { each: true })(target, key);
};

export class ListProductsQuery {
  /** Free text; matches SKU, name, chemical name, function, area, description. */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  q?: string;

  @MultiValue()
  function?: string[];

  @MultiValue()
  applicationArea?: string[];

  /** A regional filter also returns products sold globally. */
  @MultiValue()
  region?: string[];

  /** Product must carry ALL selected certifications. */
  @MultiValue()
  certification?: string[];

  /** Default: ACTIVE + PHASE_OUT. Discontinued only when asked for. */
  @Transform(toArray)
  @IsOptional()
  @IsEnum(ProductStatus, { each: true })
  status?: ProductStatus[];

  @IsOptional()
  @IsEnum(ProductSort)
  sort: ProductSort = ProductSort.NAME;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10_000)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  pageSize: number = DEFAULT_PAGE_SIZE;
}
