import { ImportJob, ImportJobStatus, Prisma } from "@prisma/client";

export type ImportJobResponseDto = {
  id: string;
  kennelClubCode: string;
  targetYear: number | null;
  status: ImportJobStatus;
  startedAt: string;
  finishedAt: string | null;
  rowsParsed: number;
  rowsImported: number;
  warnings: Prisma.JsonValue | null;
  errors: Prisma.JsonValue | null;
};

export function toImportJobResponseDto(
  importJob: ImportJob,
): ImportJobResponseDto {
  return {
    id: importJob.id,
    kennelClubCode: importJob.kennelClubCode,
    targetYear: importJob.targetYear,
    status: importJob.status,
    startedAt: importJob.startedAt.toISOString(),
    finishedAt: importJob.finishedAt?.toISOString() ?? null,
    rowsParsed: importJob.rowsParsed,
    rowsImported: importJob.rowsImported,
    warnings: importJob.warnings,
    errors: importJob.errors,
  };
}
