import { PopularityRanking, SourceDocument } from "@prisma/client";

export type RankingResponseDto = {
  id: string;
  breedId: string;
  kennelClubId: string;
  sourceDocumentId: string | null;
  sourceUrl: string | null;
  sourceTitle: string | null;
  countryCode: string;
  year: number;
  rank: number;
  rawBreedName: string | null;
  note: string | null;
};

export function toRankingResponseDto(
  ranking: PopularityRanking & { sourceDocument?: SourceDocument | null },
): RankingResponseDto {
  return {
    id: ranking.id,
    breedId: ranking.breedId,
    kennelClubId: ranking.kennelClubId,
    sourceDocumentId: ranking.sourceDocumentId,
    sourceUrl: ranking.sourceDocument?.sourceUrl ?? null,
    sourceTitle: ranking.sourceDocument?.title ?? null,
    countryCode: ranking.countryCode,
    year: ranking.year,
    rank: ranking.rank,
    rawBreedName: ranking.rawBreedName,
    note: ranking.note,
  };
}
