import { readFileSync } from 'fs';
import { resolve } from 'path';
import { CatalogueImportService } from '../../src/catalogue-import/catalogue-import.service';

export const REAL_CSV = readFileSync(
  resolve(__dirname, '../../../data/products.csv'),
  'utf8',
);

/** Seeds through the real importer, so e2e tests see production-like data. */
export async function seedCatalogue(
  importer: CatalogueImportService,
  csv: string = REAL_CSV,
) {
  return importer.importCsv(csv, 'e2e');
}
