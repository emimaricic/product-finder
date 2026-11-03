import {
  activeFilterCount,
  CatalogueQuery,
  EMPTY_QUERY,
  parseCatalogueQuery,
  toListParams,
  toQueryParams,
  withChange,
} from './catalogue-query';

describe('catalogue query ↔ URL', () => {
  const full: CatalogueQuery = {
    q: 'sulfate',
    function: ['Surfactant'],
    applicationArea: ['Home Care', 'Food & Nutrition'],
    region: ['EMEA'],
    certification: ['Vegan', 'Halal'],
    includeDiscontinued: true,
    sort: 'rating',
    page: 3,
  };

  it('round-trips every field through URL params (the shareable link)', () => {
    expect(parseCatalogueQuery(toQueryParams(full))).toEqual(full);
  });

  it('keeps the default view at a bare URL', () => {
    expect(toQueryParams(EMPTY_QUERY)).toEqual({});
    expect(parseCatalogueQuery({})).toEqual(EMPTY_QUERY);
  });

  it('accepts a single value where an array is expected', () => {
    expect(parseCatalogueQuery({ region: 'EMEA' }).region).toEqual(['EMEA']);
  });

  it('degrades hand-edited or outdated links to defaults instead of failing', () => {
    expect(
      parseCatalogueQuery({ sort: 'price', page: '-4', discontinued: 'yes', region: ['', ' EMEA ', 'EMEA'] }),
    ).toEqual({ ...EMPTY_QUERY, region: ['EMEA'] });
  });

  it('clamps values to the bounds the API validates, so a shared link never errors', () => {
    const long = 'x'.repeat(101);
    const many = Array.from({ length: 30 }, (_, i) => `v${i}`);
    const q = parseCatalogueQuery({ page: '999999', region: [long, 'EMEA'], certification: many });
    expect(q.page).toBe(10_000);
    expect(q.region).toEqual(['EMEA']);
    expect(q.certification).toHaveLength(20);
  });

  it('maps "include discontinued" to all three lifecycle statuses for the API', () => {
    expect(toListParams(full).status).toEqual(['ACTIVE', 'PHASE_OUT', 'DISCONTINUED']);
    expect(toListParams(EMPTY_QUERY).status).toBeUndefined();
  });

  it('counts narrowing filters but not search or sort', () => {
    expect(activeFilterCount(full)).toBe(7);
    expect(activeFilterCount({ ...EMPTY_QUERY, q: 'x', sort: 'newest' })).toBe(0);
  });

  it('resets to page 1 whenever the search changes', () => {
    expect(withChange(full, { region: [] }).page).toBe(1);
    expect(withChange(full, { page: 4 }).page).toBe(4);
  });
});
