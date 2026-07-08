import { ParsedRegistrationRow } from "./parsed-registration-row.type";

export interface RegistrationStatisticsParser {
  parse(content: string, year: number): ParsedRegistrationRow[];
}
