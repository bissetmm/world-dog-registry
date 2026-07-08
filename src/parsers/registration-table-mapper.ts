import { ParsedRegistrationRow } from "./parsed-registration-row.type";

export type RegistrationTableColumnNames = {
  breedName: string[];
  registrationCount: string[];
  rank?: string[];
  previousYearDifference?: string[];
};

export type MapRegistrationTableInput = {
  headers: string[];
  rows: string[][];
  year: number;
  sourceClubCode: ParsedRegistrationRow["sourceClubCode"];
  columns: RegistrationTableColumnNames;
};

export function mapRegistrationTable(
  input: MapRegistrationTableInput,
): ParsedRegistrationRow[] {
  const breedNameIndex = findHeaderIndex(
    input.headers,
    input.columns.breedName,
  );
  const registrationCountIndex = findHeaderIndex(
    input.headers,
    input.columns.registrationCount,
  );
  const rankIndex = input.columns.rank
    ? findHeaderIndex(input.headers, input.columns.rank)
    : -1;
  const previousYearDifferenceIndex = input.columns.previousYearDifference
    ? findHeaderIndex(input.headers, input.columns.previousYearDifference)
    : -1;

  if (breedNameIndex < 0 || registrationCountIndex < 0) {
    return [];
  }

  return input.rows
    .map((row) => {
      const breedName = row[breedNameIndex];
      const registrationCount = parseInteger(row[registrationCountIndex]);

      if (!breedName || registrationCount === null) {
        return null;
      }

      const parsedRow: ParsedRegistrationRow = {
        sourceClubCode: input.sourceClubCode,
        year: input.year,
        breedName,
        registrationCount,
        rawText: row.join(" | "),
      };

      if (rankIndex >= 0) {
        parsedRow.rank = parseInteger(row[rankIndex]) ?? undefined;
      }

      if (previousYearDifferenceIndex >= 0) {
        parsedRow.previousYearDifference =
          parseInteger(row[previousYearDifferenceIndex]) ?? undefined;
      }

      return parsedRow;
    })
    .filter((row): row is ParsedRegistrationRow => row !== null);
}

function findHeaderIndex(headers: string[], candidates: string[]): number {
  const normalizedCandidates = candidates.map(normalizeHeader);
  return headers.findIndex((header) =>
    normalizedCandidates.includes(normalizeHeader(header)),
  );
}

function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[\s_-]+/g, "");
}

function parseInteger(value: string | undefined): number | null {
  if (!value) {
    return null;
  }

  const normalizedValue = value.replace(/,/g, "").replace(/[+−]/g, (match) => {
    return match === "−" ? "-" : "";
  });
  const match = normalizedValue.match(/-?\d+/);

  return match ? Number(match[0]) : null;
}
