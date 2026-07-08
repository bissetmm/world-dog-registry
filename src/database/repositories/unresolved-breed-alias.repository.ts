import { Injectable } from "@nestjs/common";
import {
  Prisma,
  UnresolvedAliasStatus,
  UnresolvedBreedAlias,
} from "@prisma/client";
import { PrismaService } from "../prisma.service";

@Injectable()
export class UnresolvedBreedAliasRepository {
  constructor(private readonly prisma: PrismaService) {}

  createMany(
    data: Prisma.UnresolvedBreedAliasCreateManyInput[],
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.unresolvedBreedAlias.createMany({ data });
  }

  findMany(params: {
    kennelClubCode?: string;
    status?: UnresolvedBreedAlias["status"];
  }): Promise<UnresolvedBreedAlias[]> {
    return this.prisma.unresolvedBreedAlias.findMany({
      where: {
        kennelClubCode: params.kennelClubCode,
        status: params.status,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  findById(id: string): Promise<UnresolvedBreedAlias | null> {
    return this.prisma.unresolvedBreedAlias.findUnique({ where: { id } });
  }

  markResolved(params: {
    id: string;
    resolvedBreedId: string;
    resolvedAliasId: string;
    note?: string;
  }): Promise<UnresolvedBreedAlias> {
    return this.prisma.unresolvedBreedAlias.update({
      where: { id: params.id },
      data: {
        status: UnresolvedAliasStatus.resolved,
        resolvedBreedId: params.resolvedBreedId,
        resolvedAliasId: params.resolvedAliasId,
        resolvedAt: new Date(),
        note: params.note,
      },
    });
  }
}
