import { Module } from "@nestjs/common";
import { ChecksumService } from "../storage/checksum.service";
import { RawFileStorageService } from "../storage/raw-file-storage.service";
import { HttpDownloader } from "../downloaders/http-downloader";
import { PopularityRankingImporter } from "../importers/popularity-ranking.importer";
import { RegistrationStatisticImporter } from "../importers/registration-statistic.importer";
import { BreedNormalizer } from "../normalizers/breed-normalizer";
import { PopularityRankingNormalizer } from "../normalizers/popularity-ranking-normalizer";
import { RegistrationStatisticValidator } from "../validators/registration-statistic.validator";
import { AkcCollector } from "./akc/akc.collector";
import { AkcPdfRegistrationStatisticsParser } from "./akc/akc-pdf-registration-statistics.parser";
import { AkcPopularityRankingParser } from "./akc/akc-popularity-ranking.parser";
import { FciCollector } from "./fci/fci.collector";
import { FciBreedMasterParser } from "./fci/fci-breed-master.parser";
import { JkcCollector } from "./jkc/jkc.collector";
import { JkcRegistrationStatisticsParser } from "./jkc/jkc-registration-statistics.parser";
import { RoyalKennelClubCollector } from "./royal-kennel-club/royal-kennel-club.collector";
import { RoyalKennelClubRegistrationStatisticsParser } from "./royal-kennel-club/royal-kennel-club-registration-statistics.parser";
import { RoyalKennelClubTenYearRegistrationStatisticsParser } from "./royal-kennel-club/royal-kennel-club-ten-year-registration-statistics.parser";

@Module({
  providers: [
    ChecksumService,
    RawFileStorageService,
    HttpDownloader,
    BreedNormalizer,
    PopularityRankingNormalizer,
    RegistrationStatisticValidator,
    RegistrationStatisticImporter,
    PopularityRankingImporter,
    JkcRegistrationStatisticsParser,
    RoyalKennelClubRegistrationStatisticsParser,
    RoyalKennelClubTenYearRegistrationStatisticsParser,
    AkcPdfRegistrationStatisticsParser,
    AkcPopularityRankingParser,
    FciBreedMasterParser,
    JkcCollector,
    RoyalKennelClubCollector,
    AkcCollector,
    FciCollector,
  ],
  exports: [JkcCollector, RoyalKennelClubCollector, AkcCollector, FciCollector],
})
export class CollectorsModule {}
