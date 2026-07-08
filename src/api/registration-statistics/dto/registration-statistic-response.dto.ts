import { RegistrationStatistic, SourceDocument } from "@prisma/client";

export type RegistrationStatisticResponseDto = {
  id: string;
  breedId: string;
  kennelClubId: string;
  sourceDocumentId: string | null;
  sourceUrl: string | null;
  sourceTitle: string | null;
  countryCode: string;
  year: number;
  registrationCount: number;
  rank: number | null;
  previousYearDifference: number | null;
  rawBreedName: string | null;
  note: string | null;
};

export function toRegistrationStatisticResponseDto(
  statistic: RegistrationStatistic & { sourceDocument?: SourceDocument | null },
): RegistrationStatisticResponseDto {
  return {
    id: statistic.id,
    breedId: statistic.breedId,
    kennelClubId: statistic.kennelClubId,
    sourceDocumentId: statistic.sourceDocumentId,
    sourceUrl: statistic.sourceDocument?.sourceUrl ?? null,
    sourceTitle: statistic.sourceDocument?.title ?? null,
    countryCode: statistic.countryCode,
    year: statistic.year,
    registrationCount: statistic.registrationCount,
    rank: statistic.rank,
    previousYearDifference: statistic.previousYearDifference,
    rawBreedName: statistic.rawBreedName,
    note: statistic.note,
  };
}
