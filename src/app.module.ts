import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { BreedsModule } from "./api/breeds/breeds.module";
import { ImportJobsModule } from "./api/import-jobs/import-jobs.module";
import { KennelClubsModule } from "./api/kennel-clubs/kennel-clubs.module";
import { PopularityTrendsModule } from "./api/popularity-trends/popularity-trends.module";
import { RankingsModule } from "./api/rankings/rankings.module";
import { RegistrationStatisticsModule } from "./api/registration-statistics/registration-statistics.module";
import { SourceDocumentsModule } from "./api/source-documents/source-documents.module";
import { UnresolvedBreedAliasesModule } from "./api/unresolved-breed-aliases/unresolved-breed-aliases.module";
import { CollectorsModule } from "./collectors/collectors.module";
import { DatabaseModule } from "./database/database.module";
import { DashboardModule } from "./dashboard/dashboard.module";

@Module({
  imports: [
    DatabaseModule,
    BreedsModule,
    KennelClubsModule,
    RegistrationStatisticsModule,
    RankingsModule,
    PopularityTrendsModule,
    ImportJobsModule,
    SourceDocumentsModule,
    UnresolvedBreedAliasesModule,
    DashboardModule,
    CollectorsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
