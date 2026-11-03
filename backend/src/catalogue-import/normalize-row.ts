import { ProductStatus } from '@prisma/client';
import { normalizeSku } from '../common/sku';
import {
  CatalogueProduct,
  CsvColumn,
  ImportIssue,
  RawRecord,
} from './catalogue-row';

export type NormalizeResult =
  | { ok: true; product: CatalogueProduct; issues: ImportIssue[] }
  | { ok: false; sku: string | null; issues: ImportIssue[] };

/**
 * Status spellings seen in exports ("Active", "ACTIVE", "Phase out",
 * "Phase-out"…) are compared on letters only. An unknown status is an error:
 * we can't decide whether customers may see the product, so we don't guess.
 */
const STATUS_BY_KEY: Record<string, ProductStatus> = {
  active: ProductStatus.ACTIVE,
  phaseout: ProductStatus.PHASE_OUT,
  discontinued: ProductStatus.DISCONTINUED,
};

/** Everything except these must be present for a product to be listable. */
const REQUIRED: CsvColumn[] = [
  'sku',
  'name',
  'chemical_name',
  'function',
  'application_area',
  'region',
  'status',
  'description',
];

const MIN_LAUNCH_YEAR = 1900;

/** Trim and collapse internal whitespace (" EMEA ", "  Puraxin SF 120 "). */
export function clean(value: string | undefined): string {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}

export function parseStatus(value: string): ProductStatus | null {
  const key = value.toLowerCase().replace(/[^a-z]/g, '');
  return STATUS_BY_KEY[key] ?? null;
}

export function parseCertifications(value: string): string[] {
  const seen = new Set<string>();
  for (const part of value.split('|')) {
    const cert = clean(part);
    if (cert) seen.add(cert);
  }
  return [...seen];
}

/**
 * Turns one raw CSV record into a product, or explains why it can't.
 * Pure function — all data-quality rules live here and are unit tested.
 */
export function normalizeRow(
  { line, row }: RawRecord,
  now: Date = new Date(),
): NormalizeResult {
  const issues: ImportIssue[] = [];
  const sku = normalizeSku(row.sku ?? '') || null;
  const issue = (
    severity: ImportIssue['severity'],
    field: CsvColumn,
    message: string,
  ) => issues.push({ line, sku, field, severity, message });

  for (const field of REQUIRED) {
    if (!clean(row[field]))
      issue('error', field, `Missing required "${field}"`);
  }

  const rawStatus = clean(row.status);
  const status = rawStatus ? parseStatus(rawStatus) : null;
  if (rawStatus && !status) {
    issue('error', 'status', `Unknown status "${rawStatus}"`);
  }

  let launchYear: number | null = null;
  const rawYear = clean(row.launch_year);
  if (rawYear) {
    const year = /^\d{4}$/.test(rawYear) ? Number(rawYear) : NaN;
    const maxYear = now.getFullYear() + 1;
    if (year >= MIN_LAUNCH_YEAR && year <= maxYear) {
      launchYear = year;
    } else {
      issue(
        'warning',
        'launch_year',
        `Invalid launch year "${rawYear}", stored as unknown`,
      );
    }
  }

  if (issues.some((i) => i.severity === 'error') || !sku || !status) {
    return { ok: false, sku, issues };
  }

  return {
    ok: true,
    issues,
    product: {
      sku,
      name: clean(row.name),
      chemicalName: clean(row.chemical_name),
      function: clean(row.function),
      applicationArea: clean(row.application_area),
      region: clean(row.region),
      certifications: parseCertifications(row.certifications),
      status,
      launchYear,
      description: clean(row.description),
    },
  };
}
