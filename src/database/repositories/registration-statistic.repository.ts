import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma.service";

export type RegistrationStatisticFilters = {
  breedId?: string;
  kennelClubCode?: string;
  countryCode?: string;
  year?: number;
};

export type RegistrationStatisticWithSourceDocument =
  Prisma.RegistrationStatisticGetPayload<{
    include: { sourceDocument: true; kennelClub: true };
  }>;

@Injectable()
export class RegistrationStatisticRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(
    filters: RegistrationStatisticFilters,
  ): Promise<RegistrationStatisticWithSourceDocument[]> {
    const where: Prisma.RegistrationStatisticWhereInput = {
      breedId: filters.breedId,
      countryCode: filters.countryCode,
      year: filters.year,
      kennelClub: filters.kennelClubCode
        ? { code: filters.kennelClubCode }
        : undefined,
    };

    return this.prisma.registrationStatistic.findMany({
      where,
      include: { sourceDocument: true, kennelClub: true },
      orderBy: [{ year: "asc" }, { rank: "asc" }, { createdAt: "asc" }],
    });
  }

  createMany(
    data: Prisma.RegistrationStatisticCreateManyInput[],
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.registrationStatistic.createMany({ data });
  }
}
