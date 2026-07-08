import { Injectable } from "@nestjs/common";
import { ParsedPopularityRankingRow } from "../collectors/akc/akc-popularity-ranking.parser";
import { PrismaService } from "../database/prisma.service";
import { NormalizedPopularityRankingRow } from "./normalized-popularity-ranking-row.type";

@Injectable()
export class PopularityRankingNormalizer {
  constructor(private readonly prisma: PrismaService) {}

  async normalizeRows(
    rows: ParsedPopularityRankingRow[],
  ): Promise<NormalizedPopularityRankingRow[]> {
    const normalizedRows: NormalizedPopularityRankingRow[] = [];

    for (const row of rows) {
      const breed = await this.prisma.breed.findFirst({
        where: {
          OR: [
            { nameEn: { equals: row.breedName, mode: "insensitive" } },
            {
              aliases: {
                some: {
                  aliasName: { equals: row.breedName, mode: "insensitive" },
                },
              },
            },
          ],
        },
      });

      normalizedRows.push({
        ...row,
        breedId: breed?.id ?? null,
        unresolvedReason: breed ? undefined : "No matching Breed or BreedAlias",
      });
    }

    return normalizedRows;
  }
}
