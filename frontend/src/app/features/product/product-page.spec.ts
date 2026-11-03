import { ProductDetail } from '../../core/api/catalogue.models';
import { lifecycleOf, noticeFor } from './product-page';

const product = (over: Partial<ProductDetail> = {}): ProductDetail => ({
  sku: 'P-1', name: 'X', chemicalName: 'Y', function: 'Surfactant', applicationArea: 'Home Care',
  region: 'EMEA', certifications: [], status: 'ACTIVE', launchYear: 2010, description: 'D',
  ratingAvg: null, ratingCount: 0, listed: true, ...over,
});

describe('product lifecycle notice', () => {
  it('shows nothing for an active, listed product', () => {
    expect(noticeFor(product())).toBeNull();
  });

  it.each([
    [{ status: 'PHASE_OUT' as const }, 'PHASE_OUT', 'Being phased out'],
    [{ status: 'DISCONTINUED' as const }, 'DISCONTINUED', 'Discontinued'],
  ])('warns for %o', (over, tone, title) => {
    expect(noticeFor(product(over))).toMatchObject({ tone, title });
  });

  it('treats a product missing from the PIM export as "no longer offered", whatever its last status', () => {
    const delisted = product({ status: 'ACTIVE', listed: false });
    expect(lifecycleOf(delisted)).toBe('DELISTED');
    expect(noticeFor(delisted)?.title).toBe('No longer offered');
  });
});
