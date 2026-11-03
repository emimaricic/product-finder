import { ProductStatus } from '@prisma/client';
import { ProductSort } from './product-sort';
import { buildProductOrderBy, buildProductWhere } from './product-query';

describe('buildProductWhere', () => {
  it('hides delisted and discontinued products by default', () => {
    expect(buildProductWhere({})).toEqual({
      AND: [
        { delistedAt: null },
        { status: { in: [ProductStatus.ACTIVE, ProductStatus.PHASE_OUT] } },
      ],
    });
  });

  it('shows discontinued products only when asked, but never delisted ones', () => {
    const where = buildProductWhere({ status: [ProductStatus.DISCONTINUED] });
    expect(where.AND).toEqual(
      expect.arrayContaining([
        { delistedAt: null },
        { status: { in: [ProductStatus.DISCONTINUED] } },
      ]),
    );
  });

  it('adds Global to any regional filter', () => {
    const where = buildProductWhere({ region: ['EMEA'] });
    expect(where.AND).toContainEqual({ region: { in: ['EMEA', 'Global'] } });
  });

  it('requires all selected certifications', () => {
    const where = buildProductWhere({ certification: ['Vegan', 'Halal'] });
    expect(where.AND).toContainEqual({
      certifications: { hasEvery: ['Vegan', 'Halal'] },
    });
  });

  it('requires every search term to match some text field', () => {
    const where = buildProductWhere({ q: '  quorin   emea ' });
    const termClauses = (where.AND as object[]).filter((c) => 'OR' in c);
    expect(termClauses).toHaveLength(2);
    expect(termClauses[0]).toEqual({
      OR: expect.arrayContaining([
        { name: { contains: 'quorin', mode: 'insensitive' } },
        { sku: { contains: 'quorin', mode: 'insensitive' } },
      ]),
    });
  });

  it('caps the number of search terms', () => {
    const where = buildProductWhere({ q: 'a b c d e f g h' });
    expect((where.AND as object[]).filter((c) => 'OR' in c)).toHaveLength(5);
  });
});

describe('buildProductOrderBy', () => {
  it.each(Object.values(ProductSort))(
    '%p ends with sku as a stable tie-breaker',
    (sort) => {
      expect(buildProductOrderBy(sort).at(-1)).toEqual({ sku: 'asc' });
    },
  );

  it('puts unrated products last when sorting by rating', () => {
    expect(buildProductOrderBy(ProductSort.RATING)[0]).toEqual({
      ratingAvg: { sort: 'desc', nulls: 'last' },
    });
  });
});
