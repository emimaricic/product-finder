import 'dotenv/config';
import { Logger, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { resolve } from 'path';
import { CatalogueImportModule } from '../catalogue-import/catalogue-import.module';
import { CatalogueImportService } from '../catalogue-import/catalogue-import.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({ imports: [PrismaModule, CatalogueImportModule] })
class ImportCliModule {}

/**
 * Seed / nightly import entry point.
 *   npm run db:seed [-- path/to/products.csv]
 * Path resolution: CLI arg → CATALOGUE_CSV_PATH → ../data/products.csv (from backend/)
 * Exit code 0 = import applied (possibly with skipped rows), 1 = nothing applied.
 */
async function main() {
  const logger = new Logger('ImportCatalogue');
  const file = resolve(
    process.argv[2] ?? process.env.CATALOGUE_CSV_PATH ?? '../data/products.csv',
  );

  const app = await NestFactory.createApplicationContext(ImportCliModule, {
    logger: ['log', 'warn', 'error'],
  });
  try {
    logger.log(`Importing catalogue from ${file}`);
    const summary = await app.get(CatalogueImportService).importFromFile(file);
    const errors = summary.issues.filter((i) => i.severity === 'error').length;
    logger.log(
      `created=${summary.created} updated=${summary.updated} unchanged=${summary.unchanged} ` +
        `skipped=${summary.skipped} delisted=${summary.delisted} relisted=${summary.relisted} ` +
        `(${errors} row error(s), ${summary.issues.length - errors} warning(s); run ${summary.runId})`,
    );
  } catch (err) {
    logger.error(`Import failed: ${(err as Error).message}`);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

void main();
