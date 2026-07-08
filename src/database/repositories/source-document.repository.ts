import { Injectable } from "@nestjs/common";
import { Prisma, SourceDocument } from "@prisma/client";
import { PrismaService } from "../prisma.service";

@Injectable()
export class SourceDocumentRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(params: {
    kennelClubId?: string;
    importJobId?: string;
    year?: number;
  }): Promise<SourceDocument[]> {
    return this.prisma.sourceDocument.findMany({
      where: {
        kennelClubId: params.kennelClubId,
        importJobId: params.importJobId,
        year: params.year,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  findById(id: string): Promise<SourceDocument | null> {
    return this.prisma.sourceDocument.findUnique({ where: { id } });
  }

  create(data: Prisma.SourceDocumentCreateInput): Promise<SourceDocument> {
    return this.prisma.sourceDocument.create({ data });
  }
}
