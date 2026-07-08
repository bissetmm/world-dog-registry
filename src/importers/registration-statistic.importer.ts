import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { NormalizedRegistrationRow } from "../normalizers/normalized-registration-row.type";
import { SourceClubCode } from "../shared/types/source-club-code.type";

export type ImportRegistrationStatisticsInput = {
  sourceClubCode: SourceClubCode;
  sourceDocumentId?: string;
  rows: NormalizedRegistrationRow[];
};

@Injectable()
export class RegistrationStatisticImporter {
  constructor(private readonly prisma: PrismaService) {}

  async importRows(input: ImportRegistrationStatisticsInput): Promise<number> {
    const kennelClub = await this.prisma.kennelClub.findUniqueOrThrow({
      where: { code: input.sourceClubCode },
      include: { country: true },
    });

    const rowsWithBreed = input.rows.filter(
      (row): row is NormalizedRegistrationRow & { breedId: string } =>
        row.breedId !== null,
    );

    await this.prisma.registrationStatistic.createMany({
      data: rowsWithBreed.map((row) => ({
        breedId: row.breedId,
        kennelClubId: kennelClub.id,
        sourceDocumentId: input.sourceDocumentId,
        countryCode: kennelClub.country.code,
        year: row.year,
        registrationCount: row.registrationCount,
        rank: row.rank,
        previousYearDifference: row.previousYearDifference,
        rawBreedName: row.breedName,
        note: row.rawText,
      })),
    });

    return rowsWithBreed.length;
  }

  async saveUnresolvedAliases(
    input: ImportRegistrationStatisticsInput,
  ): Promise<number> {
    const unresolvedRows = input.rows.filter((row) => row.breedId === null);

    await this.prisma.unresolvedBreedAlias.createMany({
      data: unresolvedRows.map((row) => ({
        kennelClubCode: input.sourceClubCode,
        rawBreedName: row.breedName,
        year: row.year,
        sourceDocumentId: input.sourceDocumentId,
        note: row.unresolvedReason,
      })),
    });

    return unresolvedRows.length;
  }
}
