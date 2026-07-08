import { Injectable } from "@nestjs/common";
import { KennelClub } from "@prisma/client";
import { PrismaService } from "../prisma.service";

@Injectable()
export class KennelClubRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(): Promise<KennelClub[]> {
    return this.prisma.kennelClub.findMany({
      orderBy: { code: "asc" },
    });
  }

  findByCode(code: string): Promise<KennelClub | null> {
    return this.prisma.kennelClub.findUnique({
      where: { code },
    });
  }
}
