import { Controller, Get, Query } from "@nestjs/common";
import { RegistrationStatisticResponseDto } from "./dto/registration-statistic-response.dto";
import { RegistrationStatisticTrendResponseDto } from "./dto/registration-statistic-trend-response.dto";
import { RegistrationStatisticsService } from "./registration-statistics.service";

@Controller("registration-statistics")
export class RegistrationStatisticsController {
  constructor(
    private readonly registrationStatisticsService: RegistrationStatisticsService,
  ) {}

  @Get()
  findMany(
    @Query("breedId") breedId?: string,
    @Query("kennelClubCode") kennelClubCode?: string,
    @Query("countryCode") countryCode?: string,
    @Query("year") year?: string,
    @Query("latestOnly") latestOnly?: string,
  ): Promise<RegistrationStatisticResponseDto[]> {
    return this.registrationStatisticsService.findMany({
      breedId,
      kennelClubCode,
      countryCode,
      year: year ? Number(year) : undefined,
      latestOnly: latestOnly === "true",
    });
  }

  @Get("trends")
  findTrends(
    @Query("breedId") breedId?: string,
    @Query("kennelClubCode") kennelClubCode?: string,
    @Query("countryCode") countryCode?: string,
    @Query("latestOnly") latestOnly?: string,
  ): Promise<RegistrationStatisticTrendResponseDto[]> {
    return this.registrationStatisticsService.findTrends({
      breedId,
      kennelClubCode,
      countryCode,
      latestOnly: latestOnly === "true",
    });
  }
}
