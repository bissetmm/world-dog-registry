import { Module } from "@nestjs/common";
import { RegistrationStatisticsController } from "./registration-statistics.controller";
import { RegistrationStatisticsService } from "./registration-statistics.service";

@Module({
  controllers: [RegistrationStatisticsController],
  providers: [RegistrationStatisticsService],
})
export class RegistrationStatisticsModule {}
