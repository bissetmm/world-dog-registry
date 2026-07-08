import { Injectable } from "@nestjs/common";
import { NormalizedRegistrationRow } from "../normalizers/normalized-registration-row.type";

export type RegistrationStatisticValidationResult = {
  validRows: NormalizedRegistrationRow[];
  warnings: string[];
  errors: string[];
};

@Injectable()
export class RegistrationStatisticValidator {
  validate(
    rows: NormalizedRegistrationRow[],
  ): RegistrationStatisticValidationResult {
    const validRows: NormalizedRegistrationRow[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    for (const row of rows) {
      if (!row.breedName.trim()) {
        errors.push(`Missing breed name for ${row.sourceClubCode} ${row.year}`);
        continue;
      }

      if (!Number.isInteger(row.year) || row.year < 1800) {
        errors.push(`Invalid year for ${row.breedName}: ${row.year}`);
        continue;
      }

      if (
        !Number.isInteger(row.registrationCount) ||
        row.registrationCount < 0
      ) {
        errors.push(
          `Invalid registration count for ${row.breedName}: ${row.registrationCount}`,
        );
        continue;
      }

      if (!row.breedId) {
        warnings.push(
          `Unresolved breed alias: ${row.sourceClubCode} ${row.breedName}`,
        );
        continue;
      }

      validRows.push(row);
    }

    return { validRows, warnings, errors };
  }
}
