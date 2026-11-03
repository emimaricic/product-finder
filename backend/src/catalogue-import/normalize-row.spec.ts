import { ProductStatus } from '@prisma/client';
import { RawCatalogueRow } from './catalogue-row';
import {
  normalizeRow,
  parseCertifications,
  parseStatus,
} from './normalize-row';

const NOW = new Date('2026-06-01T00:00:00Z');

function raw(overrides: Partial<RawCatalogueRow> = {}): RawCatalogueRow {
  return {
    sku: 'P-10001',
    name: 'Quorin SF 470',
    chemical_name: 'Sodium Laureth Sulfate',
    function: 'Surfactant',
    application_area: 'Home Care',
    region: 'EMEA',
    certifications: 'Kosher|RSPO Mass Balance',
    status: 'Active',
    launch_year: '2012',
    description: 'Surfactant for home care.',
    ...overrides,
  };
}

const normalize = (o: Partial<RawCatalogueRow> = {}) =>
  normalizeRow({ line: 2, row: raw(o) }, NOW);

describe('parseStatus', () => {
  it.each([
    ['Active', ProductStatus.ACTIVE],
    ['active', ProductStatus.ACTIVE],
    ['ACTIVE', ProductStatus.ACTIVE],
    ['Phase-out', ProductStatus.PHASE_OUT],
    ['Phase out', ProductStatus.PHASE_OUT],
    ['phase_out', ProductStatus.PHASE_OUT],
    ['Discontinued', ProductStatus.DISCONTINUED],
  ])('maps %p → %p', (input, expected) => {
    expect(parseStatus(input)).toBe(expected);
  });

  it('returns null for unknown statuses instead of guessing', () => {
    expect(parseStatus('Coming soon')).toBeNull();
  });
});

describe('parseCertifications', () => {
  it('splits on |, trims and de-duplicates', () => {
    expect(parseCertifications(' Vegan | Halal|Vegan||')).toEqual([
      'Vegan',
      'Halal',
    ]);
  });

  it('treats an empty cell as "no certifications"', () => {
    expect(parseCertifications('')).toEqual([]);
  });
});

describe('normalizeRow', () => {
  it('maps a clean row to a product without issues', () => {
    const result = normalize();
    expect(result).toEqual({
      ok: true,
      issues: [],
      product: {
        sku: 'P-10001',
        name: 'Quorin SF 470',
        chemicalName: 'Sodium Laureth Sulfate',
        function: 'Surfactant',
        applicationArea: 'Home Care',
        region: 'EMEA',
        certifications: ['Kosher', 'RSPO Mass Balance'],
        status: ProductStatus.ACTIVE,
        launchYear: 2012,
        description: 'Surfactant for home care.',
      },
    });
  });

  it('trims stray whitespace (" EMEA ", "  Puraxin SF 120 ")', () => {
    const result = normalize({ region: ' EMEA ', name: '  Puraxin  SF 120 ' });
    expect(result.ok && result.product.region).toBe('EMEA');
    expect(result.ok && result.product.name).toBe('Puraxin SF 120');
  });

  it('normalises SKU casing so "p-10001 " and "P-10001" are the same product', () => {
    const result = normalize({ sku: ' p-10001 ' });
    expect(result.ok && result.product.sku).toBe('P-10001');
  });

  it('skips a row without a name — an unnamed product cannot be shown', () => {
    const result = normalize({ name: '' });
    expect(result.ok).toBe(false);
    expect(result.issues).toEqual([
      expect.objectContaining({
        severity: 'error',
        field: 'name',
        sku: 'P-10001',
      }),
    ]);
  });

  it('skips a row with an unknown status', () => {
    const result = normalize({ status: 'Coming soon' });
    expect(result.ok).toBe(false);
    expect(result.issues[0]).toMatchObject({
      severity: 'error',
      field: 'status',
    });
  });

  it('skips a row without SKU (nothing to upsert on)', () => {
    const result = normalize({ sku: '  ' });
    expect(result).toMatchObject({ ok: false, sku: null });
  });

  it.each(['n/a', '20x5', '1850', '2030'])(
    'imports launch year %p as unknown with a warning',
    (year) => {
      const result = normalize({ launch_year: year });
      expect(result.ok && result.product.launchYear).toBeNull();
      expect(result.issues).toEqual([
        expect.objectContaining({ severity: 'warning', field: 'launch_year' }),
      ]);
    },
  );

  it('accepts next year (launch announced in advance)', () => {
    const result = normalize({ launch_year: '2027' });
    expect(result.ok && result.product.launchYear).toBe(2027);
  });

  it('treats an empty launch year as unknown without a warning', () => {
    const result = normalize({ launch_year: '' });
    expect(result.ok && result.product.launchYear).toBeNull();
    expect(result.issues).toEqual([]);
  });
});
