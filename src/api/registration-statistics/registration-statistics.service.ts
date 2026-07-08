import { Injectable } from "@nestjs/common";
import {
  RegistrationStatisticFilters,
  RegistrationStatisticRepository,
  RegistrationStatisticWithSourceDocument,
} from "../../database/repositories/registration-statistic.repository";
import {
  RegistrationStatisticResponseDto,
  toRegistrationStatisticResponseDto,
} from "./dto/registration-statistic-response.dto";
import {
  RegistrationStatisticTrendResponseDto,
  toRegistrationStatisticTrendResponseDto,
} from "./dto/registration-statistic-trend-response.dto";

@Injectable()
export class RegistrationStatisticsService {
  constructor(
    private readonly registrationStatisticRepository: RegistrationStatisticRepository,
  ) {}

  async findMany(
    filters: RegistrationStatisticFilters & { latestOnly?: boolean },
  ): Promise<RegistrationStatisticResponseDto[]> {
    const statistics = await this.findStatistics(filters);
    return statistics.map(toRegistrationStatisticResponseDto);
  }

  async findTrends(
    filters: RegistrationStatisticFilters & { latestOnly?: boolean },
  ): Promise<RegistrationStatisticTrendResponseDto[]> {
    const statistics = await this.findStatistics(filters);
    return toRegistrationStatisticTrendResponseDto(statistics);
  }

  private async findStatistics(
    filters: RegistrationStatisticFilters & { latestOnly?: boolean },
  ): Promise<RegistrationStatisticWithSourceDocument[]> {
    const statistics =
      await this.registrationStatisticRepository.findMany(filters);

    return filters.latestOnly
      ? this.filterLatestSourceDocuments(statistics)
      : statistics;
  }

  private filterLatestSourceDocuments(
    statistics: RegistrationStatisticWithSourceDocument[],
  ): RegistrationStatisticWithSourceDocument[] {
    const latestSourceDocumentByGroup = new Map<
      string,
      { sourceDocumentId: string | null; createdAt: Date }
    >();

    for (const statistic of statistics) {
      const groupKey = [
        statistic.kennelClubId,
        statistic.countryCode,
        statistic.year,
      ].join(":");
      const sourceCreatedAt =
        statistic.sourceDocument?.createdAt ?? statistic.createdAt;
      const currentLatest = latestSourceDocumentByGroup.get(groupKey);

      if (!currentLatest || sourceCreatedAt > currentLatest.createdAt) {
        latestSourceDocumentByGroup.set(groupKey, {
          sourceDocumentId: statistic.sourceDocumentId,
          createdAt: sourceCreatedAt,
        });
      }
    }

    return statistics.filter((statistic) => {
      const groupKey = [
        statistic.kennelClubId,
        statistic.countryCode,
        statistic.year,
      ].join(":");
      const latest = latestSourceDocumentByGroup.get(groupKey);

      return latest?.sourceDocumentId === statistic.sourceDocumentId;
    });
  }
}
