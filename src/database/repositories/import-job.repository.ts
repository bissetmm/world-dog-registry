import { Injectable } from "@nestjs/common";
import { ImportJob, ImportJobStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma.service";

@Injectable()
export class ImportJobRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(params: {
    kennelClubCode?: string;
    status?: ImportJobStatus;
  }): Promise<ImportJob[]> {
    return this.prisma.importJob.findMany({
      where: {
        kennelClubCode: params.kennelClubCode,
        status: params.status,
      },
      orderBy: { startedAt: "desc" },
    });
  }

  findById(id: string): Promise<ImportJob | null> {
    return this.prisma.importJob.findUnique({ where: { id } });
  }

  create(data: Prisma.ImportJobCreateInput): Promise<ImportJob> {
    return this.prisma.importJob.create({ data });
  }

  updateStatus(
    id: string,
    status: ImportJobStatus,
    data: Pick<
      Prisma.ImportJobUpdateInput,
      "rowsParsed" | "rowsImported" | "warnings" | "errors" | "finishedAt"
    > = {},
  ): Promise<ImportJob> {
    return this.prisma.importJob.update({
      where: { id },
      data: {
        ...data,
        status,
      },
    });
  }
}
