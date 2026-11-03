import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { normalizeSku } from '../common/sku';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ListReviewsQuery } from './dto/list-reviews.query';
import { ReviewDto, ReviewListDto } from './dto/review.response';

const REVIEW_SELECT = {
  id: true,
  rating: true,
  authorName: true,
  company: true,
  comment: true,
  createdAt: true,
} satisfies Prisma.ReviewSelect;

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async list(sku: string, query: ListReviewsQuery): Promise<ReviewListDto> {
    const product = await this.findProduct(sku);
    const where = { productId: product.id };

    const [total, items, byRating] = await Promise.all([
      this.prisma.review.count({ where }),
      this.prisma.review.findMany({
        where,
        select: REVIEW_SELECT,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.review.groupBy({
        by: ['rating'],
        where,
        _count: { _all: true },
      }),
    ]);

    const distribution = [0, 0, 0, 0, 0];
    for (const row of byRating) distribution[row.rating - 1] = row._count._all;

    return {
      items,
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
      ratingAvg: product.ratingAvg?.toNumber() ?? null,
      ratingCount: product.ratingCount,
      distribution,
    };
  }

  async create(sku: string, dto: CreateReviewDto): Promise<ReviewDto> {
    const product = await this.findProduct(sku);
    const { website, ...data } = dto;

    if (website) {
      // Honeypot hit: answer like a success so the bot learns nothing.
      this.logger.warn(`Honeypot triggered for ${product.sku}, review dropped`);
      return {
        id: randomUUID(),
        ...data,
        company: data.company ?? null,
        createdAt: new Date(),
      };
    }

    return this.prisma.$transaction(async (tx) => {
      // Row lock serialises concurrent reviews of the same product, so the
      // aggregate below always sees every committed review.
      await tx.$queryRaw`SELECT id FROM products WHERE id = ${product.id}::uuid FOR UPDATE`;

      const review = await tx.review.create({
        data: { ...data, company: data.company || null, productId: product.id },
        select: REVIEW_SELECT,
      });

      // Recompute instead of incrementing: self-healing if anything drifted.
      const agg = await tx.review.aggregate({
        where: { productId: product.id },
        _avg: { rating: true },
        _count: { _all: true },
      });
      await tx.product.update({
        where: { id: product.id },
        data: {
          ratingAvg: agg._avg.rating,
          ratingCount: agg._count._all,
        },
      });

      return review;
    });
  }

  private async findProduct(sku: string) {
    const product = await this.prisma.product.findUnique({
      where: { sku: normalizeSku(sku) },
      select: { id: true, sku: true, ratingAvg: true, ratingCount: true },
    });
    if (!product) throw new NotFoundException(`Product ${sku} not found`);
    return product;
  }
}
