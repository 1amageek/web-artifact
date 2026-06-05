export type CsvColumnKind = "number" | "text";

export interface CsvTable {
  header: string[];
  rows: string[][];
  columnKinds: CsvColumnKind[];
}

export function parseCsv(source: string): string[][] {
  const rows: string[][] = [];
  let fields: string[] = [];
  let field = "";
  let insideQuotes = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (insideQuotes) {
      if (char === "\"") {
        const next = source[index + 1];
        if (next === "\"") {
          field += "\"";
          index += 1;
        } else {
          insideQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === ",") {
      fields.push(field);
      field = "";
    } else if (char === "\n") {
      fields.push(field);
      rows.push(fields);
      fields = [];
      field = "";
    } else if (char === "\r") {
      continue;
    } else if (char === "\"" && field.length === 0) {
      insideQuotes = true;
    } else {
      field += char;
    }
  }

  if (field.length > 0 || fields.length > 0) {
    fields.push(field);
    rows.push(fields);
  }

  return rows;
}

export function buildCsvTable(
  source: string,
  hasHeader: boolean,
): CsvTable {
  const parsed = parseCsv(source);
  const header =
    hasHeader && parsed.length > 0
      ? parsed[0] ?? []
      : Array.from({ length: maxColumnCount(parsed) }, (_, index) => `Column ${index + 1}`);
  const rows = hasHeader ? parsed.slice(1) : parsed;
  return {
    header,
    rows,
    columnKinds: inferColumnKinds(rows, header.length),
  };
}

function maxColumnCount(rows: string[][]): number {
  return rows.reduce((max, row) => Math.max(max, row.length), 0);
}

function inferColumnKinds(rows: string[][], count: number): CsvColumnKind[] {
  return Array.from({ length: count }, (_, columnIndex) => {
    const values = rows
      .map((row) => row[columnIndex]?.trim() ?? "")
      .filter((value) => value.length > 0);
    if (values.length === 0) {
      return "text";
    }
    return values.every(isNumericCell) ? "number" : "text";
  });
}

function isNumericCell(value: string): boolean {
  return /^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?$/.test(value);
}
