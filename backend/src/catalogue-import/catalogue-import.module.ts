import { Module } from '@nestjs/common';
import { CatalogueImportService } from './catalogue-import.service';

@Module({
  providers: [CatalogueImportService],
  exports: [CatalogueImportService],
})
export class CatalogueImportModule {}
