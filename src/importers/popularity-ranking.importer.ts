import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { NormalizedPopularityRankingRow } from "../normalizers/normalized-popularity-ranking-row.type";
import { SourceClubCode } from "../shared/types/source-club-code.type";

export type ImportPopularityRankingsInput = {
  sourceClubCode: SourceClubCode;
  sourceDocumentId?: string;
  rows: NormalizedPopularityRankingRow[];
};

@Injectable()
export class PopularityRankingImporter {
  constructor(private readonly prisma: PrismaService) {}

  async importRows(input: ImportPopularityRankingsInput): Promise<number> {
    const kennelClub = await this.prisma.kennelClub.findUniqueOrThrow({
      where: { code: input.sourceClubCode },
      include: { country: true },
    });
    const rowsWithBreed = input.rows.filter(
      (row): row is NormalizedPopularityRankingRow & { breedId: string } =>
        row.breedId !== null,
    );

    await this.prisma.popularityRanking.createMany({
      data: rowsWithBreed.map((row) => ({
        breedId: row.breedId,
        kennelClubId: kennelClub.id,
        sourceDocumentId: input.sourceDocumentId,
        countryCode: kennelClub.country.code,
        year: row.year,
        rank: row.rank,
        rawBreedName: row.breedName,
        note: row.rawText,
      })),
    });

    return rowsWithBreed.length;
  }
}
