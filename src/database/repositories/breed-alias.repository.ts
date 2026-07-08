import { Injectable } from "@nestjs/common";
import { BreedAlias, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma.service";

@Injectable()
export class BreedAliasRepository {
  constructor(private readonly prisma: PrismaService) {}

  findManyByBreedId(breedId: string): Promise<BreedAlias[]> {
    return this.prisma.breedAlias.findMany({
      where: { breedId },
      orderBy: [{ kennelClubId: "asc" }, { aliasName: "asc" }],
    });
  }

  findByKennelClubAndAlias(params: {
    kennelClubId: string;
    aliasName: string;
  }): Promise<BreedAlias | null> {
    return this.prisma.breedAlias.findUnique({
      where: {
        kennelClubId_aliasName: {
          kennelClubId: params.kennelClubId,
          aliasName: params.aliasName,
        },
      },
    });
  }

  create(data: Prisma.BreedAliasCreateInput): Promise<BreedAlias> {
    return this.prisma.breedAlias.create({ data });
  }
}
