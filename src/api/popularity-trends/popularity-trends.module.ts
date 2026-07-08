import { Module } from "@nestjs/common";
import { PopularityTrendsController } from "./popularity-trends.controller";
import { PopularityTrendsService } from "./popularity-trends.service";

@Module({
  controllers: [PopularityTrendsController],
  providers: [PopularityTrendsService],
})
export class PopularityTrendsModule {}
