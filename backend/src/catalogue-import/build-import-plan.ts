import { CatalogueProduct, ImportIssue, RawRecord } from './catalogue-row';
import { normalizeRow } from './normalize-row';

export interface ImportPlan {
  /** One entry per SKU — duplicates resolved (last row in the file wins). */
  products: CatalogueProduct[];
  /**
   * Every SKU present in the file, *including* rows we skipped as invalid.
   * A product with a broken row is still in the PIM — it must not be
   * delisted just because this export row was unusable.
   */
  skusInExport: Set<string>;
  skipped: number;
  issues: ImportIssue[];
}

const PRODUCT_FIELDS: (keyof CatalogueProduct)[] = [
  'name',
  'chemicalName',
  'function',
  'applicationArea',
  'region',
  'certifications',
  'status',
  'launchYear',
  'description',
];

export function changedFields(
  a: CatalogueProduct,
  b: CatalogueProduct,
): (keyof CatalogueProduct)[] {
  return PRODUCT_FIELDS.filter(
    (f) => JSON.stringify(a[f]) !== JSON.stringify(b[f]),
  );
}

/**
 * Normalises all rows and resolves duplicate SKUs.
 *
 * Duplicates: the export is assumed to be written in PIM change order, so the
 * last row wins. Conflicting duplicates (e.g. P-10151 Active vs Discontinued)
 * are reported so the PIM team can fix the source.
 */
export function buildImportPlan(
  records: RawRecord[],
  now: Date = new Date(),
): ImportPlan {
  const bySku = new Map<string, { product: CatalogueProduct; line: number }>();
  const skusInExport = new Set<string>();
  const issues: ImportIssue[] = [];
  let skipped = 0;

  for (const record of records) {
    const result = normalizeRow(record, now);
    issues.push(...result.issues);

    const sku = result.ok ? result.product.sku : result.sku;
    if (sku) skusInExport.add(sku);
    if (!result.ok) {
      skipped++;
      continue;
    }

    const previous = bySku.get(result.product.sku);
    if (previous) {
      const diff = changedFields(previous.product, result.product);
      issues.push({
        line: record.line,
        sku: result.product.sku,
        severity: 'warning',
        message:
          diff.length === 0
            ? `Duplicate of line ${previous.line} (identical), ignored`
            : `Duplicate of line ${previous.line} with different ${diff.join(', ')}; this later row wins`,
      });
    }
    bySku.set(result.product.sku, {
      product: result.product,
      line: record.line,
    });
  }

  return {
    products: [...bySku.values()].map((v) => v.product),
    skusInExport,
    skipped,
    issues,
  };
}
