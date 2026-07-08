import { RegistrationStatistic, SourceDocument } from "@prisma/client";

export type RegistrationStatisticTrendPointDto = {
  year: number;
  registrationCount: number;
  rank: number | null;
  sourceDocumentId: string | null;
  sourceUrl: string | null;
  sourceTitle: string | null;
};

export type RegistrationStatisticTrendResponseDto = {
  breedId: string;
  kennelClubId: string;
  countryCode: string;
  points: RegistrationStatisticTrendPointDto[];
};

export function toRegistrationStatisticTrendResponseDto(
  statistics: Array<
    RegistrationStatistic & { sourceDocument?: SourceDocument | null }
  >,
): RegistrationStatisticTrendResponseDto[] {
  const trends = new Map<string, RegistrationStatisticTrendResponseDto>();

  for (const statistic of statistics) {
    const trendKey = [
      statistic.breedId,
      statistic.kennelClubId,
      statistic.countryCode,
    ].join(":");

    const trend =
      trends.get(trendKey) ??
      ({
        breedId: statistic.breedId,
        kennelClubId: statistic.kennelClubId,
        countryCode: statistic.countryCode,
        points: [],
      } satisfies RegistrationStatisticTrendResponseDto);

    const pointKey = `${statistic.year}:${statistic.sourceDocumentId ?? ""}`;
    const existingPoint = trend.points.find(
      (point) => `${point.year}:${point.sourceDocumentId ?? ""}` === pointKey,
    );

    if (existingPoint) {
      existingPoint.registrationCount += statistic.registrationCount;
      existingPoint.rank = chooseHigherRank(existingPoint.rank, statistic.rank);
    } else {
      trend.points.push({
        year: statistic.year,
        registrationCount: statistic.registrationCount,
        rank: statistic.rank,
        sourceDocumentId: statistic.sourceDocumentId,
        sourceUrl: statistic.sourceDocument?.sourceUrl ?? null,
        sourceTitle: statistic.sourceDocument?.title ?? null,
      });
    }

    trends.set(trendKey, trend);
  }

  return Array.from(trends.values()).map((trend) => ({
    ...trend,
    points: trend.points.sort((a, b) => a.year - b.year),
  }));
}

function chooseHigherRank(
  currentRank: number | null,
  nextRank: number | null,
): number | null {
  if (currentRank === null) {
    return nextRank;
  }

  if (nextRank === null) {
    return currentRank;
  }

  return Math.min(currentRank, nextRank);
}
