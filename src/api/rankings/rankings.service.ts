import { Injectable } from "@nestjs/common";
import {
  PopularityRankingFilters,
  PopularityRankingRepository,
  PopularityRankingWithSourceDocument,
} from "../../database/repositories/popularity-ranking.repository";
import {
  RankingResponseDto,
  toRankingResponseDto,
} from "./dto/ranking-response.dto";
import {
  RankingTrendResponseDto,
  toRankingTrendResponseDto,
} from "./dto/ranking-trend-response.dto";

@Injectable()
export class RankingsService {
  constructor(
    private readonly popularityRankingRepository: PopularityRankingRepository,
  ) {}

  async findMany(
    filters: PopularityRankingFilters & { latestOnly?: boolean },
  ): Promise<RankingResponseDto[]> {
    const rankings = await this.findRankings(filters);
    return rankings.map(toRankingResponseDto);
  }

  async findTrends(
    filters: PopularityRankingFilters & { latestOnly?: boolean },
  ): Promise<RankingTrendResponseDto[]> {
    const rankings = await this.findRankings(filters);
    return toRankingTrendResponseDto(rankings);
  }

  private async findRankings(
    filters: PopularityRankingFilters & { latestOnly?: boolean },
  ): Promise<PopularityRankingWithSourceDocument[]> {
    const rankings = await this.popularityRankingRepository.findMany(filters);

    return filters.latestOnly
      ? this.filterLatestSourceDocuments(rankings)
      : rankings;
  }

  private filterLatestSourceDocuments(
    rankings: PopularityRankingWithSourceDocument[],
  ): PopularityRankingWithSourceDocument[] {
    const latestSourceDocumentByGroup = new Map<
      string,
      { sourceDocumentId: string | null; createdAt: Date }
    >();

    for (const ranking of rankings) {
      const groupKey = [
        ranking.kennelClubId,
        ranking.countryCode,
        ranking.year,
      ].join(":");
      const sourceCreatedAt =
        ranking.sourceDocument?.createdAt ?? ranking.createdAt;
      const currentLatest = latestSourceDocumentByGroup.get(groupKey);

      if (!currentLatest || sourceCreatedAt > currentLatest.createdAt) {
        latestSourceDocumentByGroup.set(groupKey, {
          sourceDocumentId: ranking.sourceDocumentId,
          createdAt: sourceCreatedAt,
        });
      }
    }

    return rankings.filter((ranking) => {
      const groupKey = [
        ranking.kennelClubId,
        ranking.countryCode,
        ranking.year,
      ].join(":");
      const latest = latestSourceDocumentByGroup.get(groupKey);

      return latest?.sourceDocumentId === ranking.sourceDocumentId;
    });
  }
}
