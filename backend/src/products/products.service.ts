import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ListProductsQuery } from './dto/list-products.query';
import { ProductDetailDto, ProductListDto } from './dto/product.response';
import { buildProductOrderBy, buildProductWhere } from './product-query';
import { normalizeSku, SUMMARY_SELECT, toSummary } from './product-summary';

/** Search/list and detail. Facets and alternatives live in their own services. */
@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListProductsQuery): Promise<ProductListDto> {
    const where = buildProductWhere(query);
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        select: SUMMARY_SELECT,
        orderBy: buildProductOrderBy(query.sort),
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);

    return {
      items: rows.map(toSummary),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    };
  }

  async getBySku(sku: string): Promise<ProductDetailDto> {
    const row = await this.prisma.product.findUnique({
      where: { sku: normalizeSku(sku) },
      select: { ...SUMMARY_SELECT, delistedAt: true },
    });
    if (!row) throw new NotFoundException(`Product ${sku} not found`);

    const { delistedAt, ...summary } = row;
    return { ...toSummary(summary), listed: delistedAt === null };
  }
}
