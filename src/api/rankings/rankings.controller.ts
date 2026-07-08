import { Controller, Get, Query } from "@nestjs/common";
import { RankingResponseDto } from "./dto/ranking-response.dto";
import { RankingTrendResponseDto } from "./dto/ranking-trend-response.dto";
import { RankingsService } from "./rankings.service";

@Controller("rankings")
export class RankingsController {
  constructor(private readonly rankingsService: RankingsService) {}

  @Get()
  findMany(
    @Query("breedId") breedId?: string,
    @Query("kennelClubCode") kennelClubCode?: string,
    @Query("countryCode") countryCode?: string,
    @Query("year") year?: string,
    @Query("latestOnly") latestOnly?: string,
  ): Promise<RankingResponseDto[]> {
    return this.rankingsService.findMany({
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
  ): Promise<RankingTrendResponseDto[]> {
    return this.rankingsService.findTrends({
      breedId,
      kennelClubCode,
      countryCode,
      latestOnly: latestOnly === "true",
    });
  }
}
