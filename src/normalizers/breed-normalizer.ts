import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { ParsedRegistrationRow } from "../parsers/parsed-registration-row.type";
import { NormalizedRegistrationRow } from "./normalized-registration-row.type";

@Injectable()
export class BreedNormalizer {
  constructor(private readonly prisma: PrismaService) {}

  async normalizeRegistrationRows(
    rows: ParsedRegistrationRow[],
  ): Promise<NormalizedRegistrationRow[]> {
    const normalizedRows: NormalizedRegistrationRow[] = [];

    for (const row of rows) {
      const breed = await this.prisma.breed.findFirst({
        where: {
          OR: [
            { nameEn: { equals: row.breedName, mode: "insensitive" } },
            { nameJa: { equals: row.breedName } },
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
