import { ParsedRegistrationRow } from "../parsers/parsed-registration-row.type";

export type NormalizedRegistrationRow = ParsedRegistrationRow & {
  breedId: string | null;
  unresolvedReason?: string;
};
