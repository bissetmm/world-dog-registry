import { Injectable } from "@nestjs/common";
import { Breed, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma.service";

@Injectable()
export class BreedRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(params: {
    search?: string;
    take?: number;
    skip?: number;
  }): Promise<Breed[]> {
    const where: Prisma.BreedWhereInput | undefined = params.search
      ? {
          OR: [
            { nameEn: { contains: params.search, mode: "insensitive" } },
            { nameJa: { contains: params.search, mode: "insensitive" } },
            {
              aliases: {
                some: {
                  aliasName: { contains: params.search, mode: "insensitive" },
                },
              },
            },
          ],
        }
      : undefined;

    return this.prisma.breed.findMany({
      where,
      orderBy: { nameEn: "asc" },
      take: params.take,
      skip: params.skip,
    });
  }

  findById(id: string): Promise<Breed | null> {
    return this.prisma.breed.findUnique({ where: { id } });
  }
}
