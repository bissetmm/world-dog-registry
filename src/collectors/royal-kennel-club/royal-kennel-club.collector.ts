import { Injectable } from "@nestjs/common";
import { HttpDownloader } from "../../downloaders/http-downloader";
import { RegistrationStatisticImporter } from "../../importers/registration-statistic.importer";
import { BreedNormalizer } from "../../normalizers/breed-normalizer";
import { ChecksumService } from "../../storage/checksum.service";
import { RawFileStorageService } from "../../storage/raw-file-storage.service";
import { RegistrationStatisticValidator } from "../../validators/registration-statistic.validator";
import { ImportJobRepository } from "../../database/repositories/import-job.repository";
import { KennelClubRepository } from "../../database/repositories/kennel-club.repository";
import { SourceDocumentRepository } from "../../database/repositories/source-document.repository";
import { CollectOptions } from "../common/collect-options.type";
import { CollectResult } from "../common/collect-result.type";
import { HtmlRegistrationStatisticsCollector } from "../common/html-registration-statistics.collector";
import { SourceCollector } from "../common/source-collector.interface";
import { RoyalKennelClubRegistrationStatisticsParser } from "./royal-kennel-club-registration-statistics.parser";

@Injectable()
export class RoyalKennelClubCollector implements SourceCollector {
  private readonly collector: HtmlRegistrationStatisticsCollector;

  constructor(
    downloader: HttpDownloader,
    rawFileStorageService: RawFileStorageService,
    checksumService: ChecksumService,
    parser: RoyalKennelClubRegistrationStatisticsParser,
    normalizer: BreedNormalizer,
    validator: RegistrationStatisticValidator,
    importer: RegistrationStatisticImporter,
    importJobRepository: ImportJobRepository,
    kennelClubRepository: KennelClubRepository,
    sourceDocumentRepository: SourceDocumentRepository,
  ) {
    this.collector = new HtmlRegistrationStatisticsCollector(
      {
        sourceClubCode: "RKC",
        defaultSourceUrl:
          "https://www.thekennelclub.org.uk/media-centre/breed-registration-statistics/",
        parserVersion: "royal-kennel-club-registration-statistics-parser@0.1.0",
      },
      downloader,
      rawFileStorageService,
      checksumService,
      parser,
      normalizer,
      validator,
      importer,
      importJobRepository,
      kennelClubRepository,
      sourceDocumentRepository,
    );
  }

  collect(options: CollectOptions): Promise<CollectResult> {
    return this.collector.collect(options);
  }
}
