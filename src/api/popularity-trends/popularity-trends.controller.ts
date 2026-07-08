import { Controller, Get, Query } from "@nestjs/common";
import { PopularityTrendResponseDto } from "./dto/popularity-trend-response.dto";
import { PopularityTrendsService } from "./popularity-trends.service";

@Controller("popularity-trends")
export class PopularityTrendsController {
  constructor(
    private readonly popularityTrendsService: PopularityTrendsService,
  ) {}

  @Get()
  findTrends(
    @Query("breedId") breedId?: string,
    @Query("kennelClubCode") kennelClubCode?: string,
    @Query("countryCode") countryCode?: string,
    @Query("latestOnly") latestOnly?: string,
  ): Promise<PopularityTrendResponseDto[]> {
    return this.popularityTrendsService.findTrends({
      breedId,
      kennelClubCode,
      countryCode,
      latestOnly: latestOnly === "true",
    });
  }
}
