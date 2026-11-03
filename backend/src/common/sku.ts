/**
 * The one SKU normaliser, used by the importer (writes) and every lookup
 * (reads): trim, collapse inner whitespace, upper-case. Two different rules
 * would make some imported SKUs unreachable by URL.
 */
export function normalizeSku(sku: string): string {
  return sku.replace(/\s+/g, ' ').trim().toUpperCase();
}
