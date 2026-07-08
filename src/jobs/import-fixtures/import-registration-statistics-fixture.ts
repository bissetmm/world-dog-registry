import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { NestFactory } from "@nestjs/core";
import { ImportJobStatus, SourceFormat } from "@prisma/client";
import { AppModule } from "../../app.module";
import { ImportJobRepository } from "../../database/repositories/import-job.repository";
import { KennelClubRepository } from "../../database/repositories/kennel-club.repository";
import { SourceDocumentRepository } from "../../database/repositories/source-document.repository";
import { RegistrationStatisticImporter } from "../../importers/registration-statistic.importer";
import { BreedNormalizer } from "../../normalizers/breed-normalizer";
import { RegistrationStatisticsParser } from "../../parsers/registration-statistics-parser.interface";
import { SourceClubCode } from "../../shared/types/source-club-code.type";
import { ChecksumService } from "../../storage/checksum.service";
import { RawFileStorageService } from "../../storage/raw-file-storage.service";
import { RegistrationStatisticValidator } from "../../validators/registration-statistic.validator";
import { JkcRegistrationStatisticsParser } from "../../collectors/jkc/jkc-registration-statistics.parser";
import { RoyalKennelClubRegistrationStatisticsParser } from "../../collectors/royal-kennel-club/royal-kennel-club-registration-statistics.parser";

type FixtureImportArgs = {
  sourceClubCode: SourceClubCode;
  year: number;
  filePath: string;
};

type FixtureImportResult = {
  importJobId: string;
  sourceDocumentId: string;
  rowsParsed: number;
  rowsImported: number;
  unresolvedBreedAliases: number;
  warnings: string[];
  errors: string[];
};

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  try {
    const parser = resolveParser(args.sourceClubCode, app);
    const result = await importFixture(args, parser, app);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } finally {
    await app.close();
  }
}

async function importFixture(
  args: FixtureImportArgs,
  parser: RegistrationStatisticsParser,
  app: ReturnType<typeof NestFactory.createApplicationContext> extends Promise<
    infer T
  >
    ? T
    : never,
): Promise<FixtureImportResult> {
  const importJobRepository = app.get(ImportJobRepository);
  const kennelClubRepository = app.get(KennelClubRepository);
  const sourceDocumentRepository = app.get(SourceDocumentRepository);
  const checksumService = app.get(ChecksumService);
  const rawFileStorageService = app.get(RawFileStorageService);
  const normalizer = app.get(BreedNormalizer);
  const validator = app.get(RegistrationStatisticValidator);
  const importer = app.get(RegistrationStatisticImporter);

  const importJob = await importJobRepository.create({
    kennelClubCode: args.sourceClubCode,
    targetYear: args.year,
    status: ImportJobStatus.running,
  });

  try {
    const content = await readFile(args.filePath);
    const checksum = checksumService.sha256(content);
    const savedFilePath = await rawFileStorageService.save({
      sourceClubCode: args.sourceClubCode,
      year: args.year,
      fileName: basename(args.filePath),
      content,
    });
    const kennelClub = await kennelClubRepository.findByCode(
      args.sourceClubCode,
    );

    if (!kennelClub) {
      throw new Error(`KennelClub not found: ${args.sourceClubCode}`);
    }

    const sourceDocument = await sourceDocumentRepository.create({
      kennelClub: { connect: { id: kennelClub.id } },
      importJob: { connect: { id: importJob.id } },
      filePath: savedFilePath,
      fileName: basename(args.filePath),
      fileType: "text/html",
      sourceFormat: SourceFormat.HTML,
      checksum,
      year: args.year,
      title: `${args.sourceClubCode} fixture ${args.year}`,
      parserVersion: `${args.sourceClubCode.toLowerCase()}-fixture-import@0.1.0`,
      retrievedAt: new Date(),
    });

    const parsedRows = parser.parse(content.toString("utf8"), args.year);
    const normalizedRows =
      await normalizer.normalizeRegistrationRows(parsedRows);
    const validationResult = validator.validate(normalizedRows);
    const rowsImported = await importer.importRows({
      sourceClubCode: args.sourceClubCode,
      sourceDocumentId: sourceDocument.id,
      rows: validationResult.validRows,
    });
    const unresolvedBreedAliases = await importer.saveUnresolvedAliases({
      sourceClubCode: args.sourceClubCode,
      sourceDocumentId: sourceDocument.id,
      rows: normalizedRows,
    });
    const status =
      validationResult.errors.length > 0
        ? ImportJobStatus.partial_success
        : ImportJobStatus.success;

    await importJobRepository.updateStatus(importJob.id, status, {
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
      error instanceof Error ? error.message : "Unknown fixture import error";

    await importJobRepository.updateStatus(
      importJob.id,
      ImportJobStatus.failed,
      {
        errors: [message],
        finishedAt: new Date(),
      },
    );

    throw error;
  }
}

function resolveParser(
  sourceClubCode: SourceClubCode,
  app: ReturnType<typeof NestFactory.createApplicationContext> extends Promise<
    infer T
  >
    ? T
    : never,
): RegistrationStatisticsParser {
  switch (sourceClubCode) {
    case "JKC":
      return app.get(JkcRegistrationStatisticsParser);
    case "RKC":
      return app.get(RoyalKennelClubRegistrationStatisticsParser);
    case "AKC":
    case "FCI":
      throw new Error(`${sourceClubCode} fixture import is not supported yet`);
  }
}

function parseArgs(args: string[]): FixtureImportArgs {
  const sourceClubCode = readRequiredArg(args, "--source") as SourceClubCode;
  const year = Number(readRequiredArg(args, "--year"));
  const filePath = resolve(readRequiredArg(args, "--file"));

  if (!["JKC", "RKC"].includes(sourceClubCode)) {
    throw new Error(`Unsupported --source value: ${sourceClubCode}`);
  }

  if (!Number.isInteger(year)) {
    throw new Error(`Invalid --year value: ${year}`);
  }

  return { sourceClubCode, year, filePath };
}

function readRequiredArg(args: string[], name: string): string {
  const index = args.indexOf(name);
  const value = index >= 0 ? args[index + 1] : undefined;

  if (!value) {
    throw new Error(`Missing required argument: ${name}`);
  }

  return value;
}

void main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : "Unknown fixture import error";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
