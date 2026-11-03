import { parse } from 'csv-parse/sync';
import { CSV_COLUMNS, RawCatalogueRow, RawRecord } from './catalogue-row';

export class CatalogueFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CatalogueFormatError';
  }
}

/**
 * Parses the PIM export. A wrong header is a hard failure (the whole file is
 * suspect — e.g. a changed export format), whereas bad *rows* are handled
 * individually by normalizeRow.
 */
export function parseCatalogueCsv(content: string): RawRecord[] {
  let records: { record: string[]; info: { lines: number } }[];
  try {
    // With `info: true` each entry is { record, info } — the lib's typings
    // don't narrow on that option, hence the cast.
    records = parse(content, {
      bom: true,
      info: true,
      relax_column_count: true,
      skip_empty_lines: true,
    }) as unknown as typeof records;
  } catch (err) {
    throw new CatalogueFormatError(
      `CSV could not be parsed: ${(err as Error).message}`,
    );
  }

  const [header, ...rows] = records;
  const columns = (header?.record ?? []).map((c) => c.trim().toLowerCase());
  const missing = CSV_COLUMNS.filter((c) => !columns.includes(c));
  if (missing.length > 0) {
    throw new CatalogueFormatError(
      `CSV header is missing column(s): ${missing.join(', ')}`,
    );
  }

  return rows.map(({ record, info }) => {
    const row = {} as RawCatalogueRow;
    for (const column of CSV_COLUMNS) {
      row[column] = record[columns.indexOf(column)] ?? '';
    }
    return { line: info.lines, row };
  });
}
