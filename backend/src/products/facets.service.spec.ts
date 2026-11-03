import { regionCounts } from './facets.service';

describe('regionCounts', () => {
  it('adds Global products to every regional count, and leaves Global itself alone', () => {
    const counts = regionCounts(
      new Map([
        ['EMEA', 40],
        ['Asia Pacific', 0],
        ['Global', 54],
      ]),
    );
    expect(counts.get('EMEA')).toBe(94);
    expect(counts.get('Asia Pacific')).toBe(54); // only Global matches → still selectable
    expect(counts.get('Global')).toBe(54);
  });
});
