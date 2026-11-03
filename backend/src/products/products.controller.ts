import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ListProductsQuery } from './dto/list-products.query';
import {
  ProductDetailDto,
  ProductFacetsDto,
  ProductListDto,
  ProductSummaryDto,
} from './dto/product.response';
import { AlternativesService } from './alternatives.service';
import { ProductFacetsService } from './facets.service';
import { ProductsService } from './products.service';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly products: ProductsService,
    private readonly facetsService: ProductFacetsService,
    private readonly alternativesService: AlternativesService,
  ) {}

  /** Search, filter, sort and paginate the catalogue. */
  @Get()
  list(@Query() query: ListProductsQuery): Promise<ProductListDto> {
    return this.products.list(query);
  }

  /**
   * Filter options with cross-filtered counts (each facet counted with all
   * other filters applied), plus when the catalogue was last imported.
   * Accepts the same filter params as the list.
   */
  @Get('facets')
  facets(@Query() query: ListProductsQuery): Promise<ProductFacetsDto> {
    return this.facetsService.facets(query);
  }

  /** Active replacements with the same function, best fit first. */
  @Get(':sku/alternatives')
  alternatives(@Param('sku') sku: string): Promise<ProductSummaryDto[]> {
    return this.alternativesService.forSku(sku);
  }

  /** Product detail. Also resolves delisted/discontinued products (old links). */
  @Get(':sku')
  get(@Param('sku') sku: string): Promise<ProductDetailDto> {
    return this.products.getBySku(sku);
  }
}
