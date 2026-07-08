import { SourceClubCode } from "../shared/types/source-club-code.type";

export type ParsedRegistrationRow = {
  sourceClubCode: SourceClubCode;
  year: number;
  breedName: string;
  registrationCount: number;
  rank?: number;
  previousYearDifference?: number;
  rawText?: string;
};
