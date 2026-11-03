import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { AlternativesService } from './alternatives.service';
import { ProductFacetsService } from './facets.service';
import { ProductsService } from './products.service';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, ProductFacetsService, AlternativesService],
})
export class ProductsModule {}
