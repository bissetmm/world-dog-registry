import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma.service";

export type PopularityRankingFilters = {
  breedId?: string;
  kennelClubCode?: string;
  countryCode?: string;
  year?: number;
};

export type PopularityRankingWithSourceDocument =
  Prisma.PopularityRankingGetPayload<{
    include: { sourceDocument: true; kennelClub: true };
  }>;

@Injectable()
export class PopularityRankingRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(
    filters: PopularityRankingFilters,
  ): Promise<PopularityRankingWithSourceDocument[]> {
    const where: Prisma.PopularityRankingWhereInput = {
      breedId: filters.breedId,
      countryCode: filters.countryCode,
      year: filters.year,
      kennelClub: filters.kennelClubCode
        ? { code: filters.kennelClubCode }
        : undefined,
    };

    return this.prisma.popularityRanking.findMany({
      where,
      include: { sourceDocument: true, kennelClub: true },
      orderBy: [{ year: "asc" }, { rank: "asc" }, { createdAt: "asc" }],
    });
  }
}
