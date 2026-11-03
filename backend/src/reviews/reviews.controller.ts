import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CreateReviewDto } from './dto/create-review.dto';
import { ListReviewsQuery } from './dto/list-reviews.query';
import { ReviewDto, ReviewListDto } from './dto/review.response';
import { ReviewsService } from './reviews.service';

/**
 * Without auth, the per-IP limit is our main spam brake on the only write
 * flow. Resolved per request so ops (and tests) can tune it via env.
 */
export const REVIEW_WRITE_LIMIT = {
  ttl: () => Number(process.env.REVIEW_RATE_LIMIT_TTL_MS ?? 10 * 60_000),
  limit: () => Number(process.env.REVIEW_RATE_LIMIT_MAX ?? 5),
};

@ApiTags('reviews')
@Controller('products/:sku/reviews')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  /** Newest first, with the product's rating summary and star distribution. */
  @Get()
  list(
    @Param('sku') sku: string,
    @Query() query: ListReviewsQuery,
  ): Promise<ReviewListDto> {
    return this.reviews.list(sku, query);
  }

  /** Publish a review. Anonymous; rate limited per IP. */
  @Post()
  @Throttle({ default: REVIEW_WRITE_LIMIT })
  create(
    @Param('sku') sku: string,
    @Body() dto: CreateReviewDto,
  ): Promise<ReviewDto> {
    return this.reviews.create(sku, dto);
  }
}
