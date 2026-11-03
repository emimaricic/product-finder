import { ProductStatus } from '@prisma/client';
import { buildImportPlan } from './build-import-plan';
import { RawCatalogueRow, RawRecord } from './catalogue-row';

function record(line: number, overrides: Partial<RawCatalogueRow>): RawRecord {
  return {
    line,
    row: {
      sku: 'P-1',
      name: 'Name',
      chemical_name: 'Chem',
      function: 'Surfactant',
      application_area: 'Home Care',
      region: 'EMEA',
      certifications: '',
      status: 'Active',
      launch_year: '2010',
      description: 'Desc',
      ...overrides,
    },
  };
}

describe('buildImportPlan', () => {
  it('collapses an identical duplicate into one product with a warning', () => {
    const plan = buildImportPlan([record(2, {}), record(9, {})]);
    expect(plan.products).toHaveLength(1);
    expect(plan.issues).toEqual([
      expect.objectContaining({
        line: 9,
        severity: 'warning',
        message: expect.stringMatching(/identical/),
      }),
    ]);
  });

  it('lets the later row win when duplicates conflict, and names the differing field', () => {
    const plan = buildImportPlan([
      record(2, { status: 'Active' }),
      record(9, { status: 'Discontinued' }),
    ]);
    expect(plan.products).toEqual([
      expect.objectContaining({
        sku: 'P-1',
        status: ProductStatus.DISCONTINUED,
      }),
    ]);
    expect(plan.issues[0].message).toMatch(/different status/);
  });

  it('counts invalid rows as skipped but still as "present in the export"', () => {
    const plan = buildImportPlan([
      record(2, { sku: 'P-1' }),
      record(3, { sku: 'P-2', name: '' }),
    ]);
    expect(plan.products.map((p) => p.sku)).toEqual(['P-1']);
    expect(plan.skipped).toBe(1);
    // P-2 must not be delisted just because this export row was broken.
    expect([...plan.skusInExport]).toEqual(['P-1', 'P-2']);
  });
});
