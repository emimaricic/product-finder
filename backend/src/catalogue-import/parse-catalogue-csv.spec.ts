import { CatalogueFormatError, parseCatalogueCsv } from './parse-catalogue-csv';

const BOM = '\uFEFF';
const HEADER =
  'sku,name,chemical_name,function,application_area,region,certifications,status,launch_year,description';

describe('parseCatalogueCsv', () => {
  it('maps columns by header name and keeps file line numbers', () => {
    const csv = `${HEADER}\nP-1,A,B,C,D,EMEA,,Active,2010,Desc\n\nP-2,A2,B,C,D,EMEA,,Active,2011,Desc`;
    const records = parseCatalogueCsv(csv);
    expect(records.map((r) => [r.line, r.row.sku])).toEqual([
      [2, 'P-1'],
      [4, 'P-2'],
    ]);
  });

  it('handles quoted values containing commas and a UTF-8 BOM', () => {
    const csv = `${BOM}${HEADER}\nP-1,A,B,C,D,EMEA,,Active,2010,"Stable, clear, mild"`;
    expect(parseCatalogueCsv(csv)[0].row.description).toBe(
      'Stable, clear, mild',
    );
  });

  it('does not depend on column order', () => {
    const reordered = HEADER.split(',').reverse().join(',');
    const csv = `${reordered}\nDesc,2010,Active,,EMEA,D,C,B,A,P-1`;
    expect(parseCatalogueCsv(csv)[0].row).toMatchObject({
      sku: 'P-1',
      name: 'A',
    });
  });

  it('rejects the whole file when a required column is missing', () => {
    const csv = 'sku,name\nP-1,A';
    expect(() => parseCatalogueCsv(csv)).toThrow(CatalogueFormatError);
    expect(() => parseCatalogueCsv(csv)).toThrow(/chemical_name/);
  });

  it('rejects an empty file', () => {
    expect(() => parseCatalogueCsv('')).toThrow(CatalogueFormatError);
  });
});
