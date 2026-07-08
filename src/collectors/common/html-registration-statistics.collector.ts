import { ImportJobStatus, SourceDocument, SourceFormat } from "@prisma/client";
import { HttpDownloader } from "../../downloaders/http-downloader";
import { RegistrationStatisticImporter } from "../../importers/registration-statistic.importer";
import { BreedNormalizer } from "../../normalizers/breed-normalizer";
import { RegistrationStatisticsParser } from "../../parsers/registration-statistics-parser.interface";
import { SourceClubCode } from "../../shared/types/source-club-code.type";
import { ChecksumService } from "../../storage/checksum.service";
import { RawFileStorageService } from "../../storage/raw-file-storage.service";
import { RegistrationStatisticValidator } from "../../validators/registration-statistic.validator";
import { ImportJobRepository } from "../../database/repositories/import-job.repository";
import { KennelClubRepository } from "../../database/repositories/kennel-club.repository";
import { SourceDocumentRepository } from "../../database/repositories/source-document.repository";
import { CollectOptions } from "./collect-options.type";
import { CollectResult } from "./collect-result.type";
import { SourceCollector } from "./source-collector.interface";

export type HtmlRegistrationStatisticsCollectorConfig = {
  sourceClubCode: SourceClubCode;
  defaultSourceUrl: string;
  parserVersion: string;
};

export class HtmlRegistrationStatisticsCollector implements SourceCollector {
  constructor(
    private readonly config: HtmlRegistrationStatisticsCollectorConfig,
    private readonly downloader: HttpDownloader,
    private readonly rawFileStorageService: RawFileStorageService,
    private readonly checksumService: ChecksumService,
    private readonly parser: RegistrationStatisticsParser,
    private readonly normalizer: BreedNormalizer,
    private readonly validator: RegistrationStatisticValidator,
    private readonly importer: RegistrationStatisticImporter,
    private readonly importJobRepository: ImportJobRepository,
    private readonly kennelClubRepository: KennelClubRepository,
    private readonly sourceDocumentRepository: SourceDocumentRepository,
  ) {}

  async collect(options: CollectOptions): Promise<CollectResult> {
    const importJob = await this.importJobRepository.create({
      kennelClubCode: this.config.sourceClubCode,
      targetYear: options.year,
      status: ImportJobStatus.running,
    });

    try {
      const sourceUrl = options.sourceUrl ?? this.config.defaultSourceUrl;
      const downloadedFile = await this.downloader.download(sourceUrl);
      const checksum = this.checksumService.sha256(downloadedFile.content);
      const fileName = this.createFileName(sourceUrl, options.year);
      const filePath = await this.rawFileStorageService.save({
        sourceClubCode: this.config.sourceClubCode,
        year: options.year,
        fileName,
        content: downloadedFile.content,
      });
      const sourceDocument = await this.createSourceDocument({
        sourceUrl,
        filePath,
        fileName,
        contentType: downloadedFile.contentType,
        checksum,
        year: options.year,
        importJobId: importJob.id,
        retrievedAt: downloadedFile.retrievedAt,
      });

      const parsedRows = this.parser.parse(
        downloadedFile.content.toString("utf8"),
        options.year ?? new Date().getFullYear(),
      );
      const normalizedRows =
        await this.normalizer.normalizeRegistrationRows(parsedRows);
      const validationResult = this.validator.validate(normalizedRows);

      const rowsImported = await this.importer.importRows({
        sourceClubCode: this.config.sourceClubCode,
        sourceDocumentId: sourceDocument.id,
        rows: validationResult.validRows,
      });
      const unresolvedBreedAliases = await this.importer.saveUnresolvedAliases({
        sourceClubCode: this.config.sourceClubCode,
        sourceDocumentId: sourceDocument.id,
        rows: normalizedRows,
      });

      const status =
        validationResult.errors.length > 0
          ? ImportJobStatus.partial_success
          : ImportJobStatus.success;

      await this.importJobRepository.updateStatus(importJob.id, status, {
        rowsParsed: parsedRows.length,
        rowsImported,
        warnings: validationResult.warnings,
        errors: validationResult.errors,
        finishedAt: new Date(),
      });

      return {
        importJobId: importJob.id,
        sourceDocumentId: sourceDocument.id,
        rowsParsed: parsedRows.length,
        rowsImported,
        unresolvedBreedAliases,
        warnings: validationResult.warnings,
        errors: validationResult.errors,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unknown collector error";

      await this.importJobRepository.updateStatus(
        importJob.id,
        ImportJobStatus.failed,
        {
          errors: [message],
          finishedAt: new Date(),
        },
      );

      return {
        importJobId: importJob.id,
        rowsParsed: 0,
        rowsImported: 0,
        unresolvedBreedAliases: 0,
        warnings: [],
        errors: [message],
      };
    }
  }

  private async createSourceDocument(input: {
    sourceUrl: string;
    filePath: string;
    fileName: string;
    contentType?: string;
    checksum: string;
    year?: number;
    importJobId: string;
    retrievedAt: Date;
  }): Promise<SourceDocument> {
    const kennelClub = await this.kennelClubRepository.findByCode(
      this.config.sourceClubCode,
    );

    if (!kennelClub) {
      throw new Error(`KennelClub not found: ${this.config.sourceClubCode}`);
    }

    return this.sourceDocumentRepository.create({
      kennelClub: { connect: { id: kennelClub.id } },
      importJob: { connect: { id: input.importJobId } },
      sourceUrl: input.sourceUrl,
      filePath: input.filePath,
      fileName: input.fileName,
      fileType: input.contentType,
      sourceFormat: SourceFormat.HTML,
      checksum: input.checksum,
      year: input.year,
      parserVersion: this.config.parserVersion,
      retrievedAt: input.retrievedAt,
    });
  }

  private createFileName(sourceUrl: string, year?: number): string {
    const url = new URL(sourceUrl);
    const lastPathSegment = url.pathname.split("/").filter(Boolean).pop();
    const baseName = lastPathSegment?.includes(".")
      ? lastPathSegment
      : `${this.config.sourceClubCode.toLowerCase()}-${year ?? "unknown"}.html`;

    return baseName;
  }
}
