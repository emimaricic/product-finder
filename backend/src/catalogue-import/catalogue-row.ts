import { ProductStatus } from '@prisma/client';

/** Columns of the PIM export, exactly as they appear in the CSV header. */
export const CSV_COLUMNS = [
  'sku',
  'name',
  'chemical_name',
  'function',
  'application_area',
  'region',
  'certifications',
  'status',
  'launch_year',
  'description',
] as const;

export type CsvColumn = (typeof CSV_COLUMNS)[number];
export type RawCatalogueRow = Record<CsvColumn, string>;

/** A raw CSV record together with its 1-based line number in the file. */
export interface RawRecord {
  line: number;
  row: RawCatalogueRow;
}

/** PIM-owned product fields after normalisation — what the import writes. */
export interface CatalogueProduct {
  sku: string;
  name: string;
  chemicalName: string;
  function: string;
  applicationArea: string;
  region: string;
  certifications: string[];
  status: ProductStatus;
  launchYear: number | null;
  description: string;
}

export type IssueSeverity = 'error' | 'warning';

/**
 * A data-quality finding. `error` = row skipped, `warning` = row imported
 * with a corrected/defaulted value. Stored on the ImportRun for the PIM team.
 */
export interface ImportIssue {
  line: number;
  sku: string | null;
  field?: CsvColumn;
  severity: IssueSeverity;
  message: string;
}
