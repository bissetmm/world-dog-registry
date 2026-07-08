import { Injectable } from "@nestjs/common";
import {
  PopularityRankingFilters,
  PopularityRankingRepository,
  PopularityRankingWithSourceDocument,
} from "../../database/repositories/popularity-ranking.repository";
import {
  RegistrationStatisticFilters,
  RegistrationStatisticRepository,
  RegistrationStatisticWithSourceDocument,
} from "../../database/repositories/registration-statistic.repository";
import {
  PopularityTrendPointDto,
  PopularityTrendResponseDto,
} from "./dto/popularity-trend-response.dto";

type PopularityTrendFilters = RegistrationStatisticFilters &
  PopularityRankingFilters & {
    latestOnly?: boolean;
  };

type TrendAccumulator = Omit<PopularityTrendResponseDto, "points"> & {
  points: PopularityTrendPointDto[];
};

@Injectable()
export class PopularityTrendsService {
  constructor(
    private readonly registrationStatisticRepository: RegistrationStatisticRepository,
    private readonly popularityRankingRepository: PopularityRankingRepository,
  ) {}

  async findTrends(
    filters: PopularityTrendFilters,
  ): Promise<PopularityTrendResponseDto[]> {
    const [registrationStatistics, popularityRankings] = await Promise.all([
      this.shouldIncludeRegistrationStatistics(filters)
        ? this.registrationStatisticRepository.findMany(filters)
        : Promise.resolve([]),
      this.shouldIncludePopularityRankings(filters)
        ? this.popularityRankingRepository.findMany(filters)
        : Promise.resolve([]),
    ]);
    const latestRegistrationStatistics = filters.latestOnly
      ? this.filterLatestSourceDocuments(registrationStatistics)
      : registrationStatistics;
    const latestPopularityRankings = filters.latestOnly
      ? this.filterLatestSourceDocuments(popularityRankings)
      : popularityRankings;

    return this.toTrendResponse(
      latestRegistrationStatistics.filter(
        (statistic) => statistic.rank !== null,
      ),
      latestPopularityRankings,
    );
  }

  private shouldIncludeRegistrationStatistics(
    filters: PopularityTrendFilters,
  ): boolean {
    return !filters.kennelClubCode || filters.kennelClubCode !== "AKC";
  }

  private shouldIncludePopularityRankings(
    filters: PopularityTrendFilters,
  ): boolean {
    return !filters.kennelClubCode || filters.kennelClubCode === "AKC";
  }

  private toTrendResponse(
    registrationStatistics: RegistrationStatisticWithSourceDocument[],
    popularityRankings: PopularityRankingWithSourceDocument[],
  ): PopularityTrendResponseDto[] {
    const trends = new Map<string, TrendAccumulator>();

    for (const statistic of registrationStatistics) {
      if (statistic.rank === null) {
        continue;
      }

      this.addPoint(trends, {
        breedId: statistic.breedId,
        kennelClubId: statistic.kennelClubId,
        kennelClubCode: statistic.kennelClub.code,
        countryCode: statistic.countryCode,
        point: {
          year: statistic.year,
          rank: statistic.rank,
          sourceDocumentId: statistic.sourceDocumentId,
          sourceType: "registration_statistic",
        },
      });
    }

    for (const ranking of popularityRankings) {
      this.addPoint(trends, {
        breedId: ranking.breedId,
        kennelClubId: ranking.kennelClubId,
        kennelClubCode: ranking.kennelClub.code,
        countryCode: ranking.countryCode,
        point: {
          year: ranking.year,
          rank: ranking.rank,
          sourceDocumentId: ranking.sourceDocumentId,
          sourceType: "popularity_ranking",
        },
      });
    }

    return Array.from(trends.values()).map((trend) => ({
      ...trend,
      points: trend.points.sort((left, right) => left.year - right.year),
    }));
  }

  private addPoint(
    trends: Map<string, TrendAccumulator>,
    input: Omit<TrendAccumulator, "points"> & {
      point: PopularityTrendPointDto;
    },
  ): void {
    const trendKey = [
      input.breedId,
      input.kennelClubId,
      input.countryCode,
    ].join(":");
    const trend =
      trends.get(trendKey) ??
      ({
        breedId: input.breedId,
        kennelClubId: input.kennelClubId,
        kennelClubCode: input.kennelClubCode,
        countryCode: input.countryCode,
        points: [],
      } satisfies TrendAccumulator);
    const pointKey = `${input.point.year}:${input.point.sourceDocumentId ?? ""}`;
    const existingPoint = trend.points.find(
      (point) => `${point.year}:${point.sourceDocumentId ?? ""}` === pointKey,
    );

    if (existingPoint) {
      existingPoint.rank = Math.min(existingPoint.rank, input.point.rank);
    } else {
      trend.points.push(input.point);
    }

    trends.set(trendKey, trend);
  }

  private filterLatestSourceDocuments<
    T extends {
      kennelClubId: string;
      countryCode: string;
      year: number;
      sourceDocumentId: string | null;
      createdAt: Date;
      sourceDocument: { createdAt: Date } | null;
    },
  >(rows: T[]): T[] {
    const latestSourceDocumentByGroup = new Map<
      string,
      { sourceDocumentId: string | null; createdAt: Date }
    >();

    for (const row of rows) {
      const groupKey = [row.kennelClubId, row.countryCode, row.year].join(":");
      const sourceCreatedAt = row.sourceDocument?.createdAt ?? row.createdAt;
      const currentLatest = latestSourceDocumentByGroup.get(groupKey);

      if (!currentLatest || sourceCreatedAt > currentLatest.createdAt) {
        latestSourceDocumentByGroup.set(groupKey, {
          sourceDocumentId: row.sourceDocumentId,
          createdAt: sourceCreatedAt,
        });
      }
    }

    return rows.filter((row) => {
      const groupKey = [row.kennelClubId, row.countryCode, row.year].join(":");
      const latest = latestSourceDocumentByGroup.get(groupKey);

      return latest?.sourceDocumentId === row.sourceDocumentId;
    });
  }
}
