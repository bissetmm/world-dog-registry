import { PopularityRanking, SourceDocument } from "@prisma/client";

export type RankingTrendPointDto = {
  year: number;
  rank: number;
  sourceDocumentId: string | null;
  sourceUrl: string | null;
  sourceTitle: string | null;
};

export type RankingTrendResponseDto = {
  breedId: string;
  kennelClubId: string;
  countryCode: string;
  points: RankingTrendPointDto[];
};

export function toRankingTrendResponseDto(
  rankings: Array<
    PopularityRanking & { sourceDocument?: SourceDocument | null }
  >,
): RankingTrendResponseDto[] {
  const trends = new Map<string, RankingTrendResponseDto>();

  for (const ranking of rankings) {
    const trendKey = [
      ranking.breedId,
      ranking.kennelClubId,
      ranking.countryCode,
    ].join(":");
    const trend =
      trends.get(trendKey) ??
      ({
        breedId: ranking.breedId,
        kennelClubId: ranking.kennelClubId,
        countryCode: ranking.countryCode,
        points: [],
      } satisfies RankingTrendResponseDto);
    const pointKey = `${ranking.year}:${ranking.sourceDocumentId ?? ""}`;
    const existingPoint = trend.points.find(
      (point) => `${point.year}:${point.sourceDocumentId ?? ""}` === pointKey,
    );

    if (existingPoint) {
      existingPoint.rank = Math.min(existingPoint.rank, ranking.rank);
    } else {
      trend.points.push({
        year: ranking.year,
        rank: ranking.rank,
        sourceDocumentId: ranking.sourceDocumentId,
        sourceUrl: ranking.sourceDocument?.sourceUrl ?? null,
        sourceTitle: ranking.sourceDocument?.title ?? null,
      });
    }

    trends.set(trendKey, trend);
  }

  return Array.from(trends.values()).map((trend) => ({
    ...trend,
    points: trend.points.sort((a, b) => a.year - b.year),
  }));
}
