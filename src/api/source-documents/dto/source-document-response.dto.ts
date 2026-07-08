import { SourceDocument, SourceFormat } from "@prisma/client";

export type SourceDocumentResponseDto = {
  id: string;
  kennelClubId: string;
  importJobId: string | null;
  sourceUrl: string | null;
  filePath: string | null;
  fileName: string | null;
  fileType: string | null;
  sourceFormat: SourceFormat | null;
  checksum: string | null;
  year: number | null;
  title: string | null;
  parserVersion: string | null;
  retrievedAt: string | null;
  createdAt: string;
};

export function toSourceDocumentResponseDto(
  sourceDocument: SourceDocument,
): SourceDocumentResponseDto {
  return {
    id: sourceDocument.id,
    kennelClubId: sourceDocument.kennelClubId,
    importJobId: sourceDocument.importJobId,
    sourceUrl: sourceDocument.sourceUrl,
    filePath: sourceDocument.filePath,
    fileName: sourceDocument.fileName,
    fileType: sourceDocument.fileType,
    sourceFormat: sourceDocument.sourceFormat,
    checksum: sourceDocument.checksum,
    year: sourceDocument.year,
    title: sourceDocument.title,
    parserVersion: sourceDocument.parserVersion,
    retrievedAt: sourceDocument.retrievedAt?.toISOString() ?? null,
    createdAt: sourceDocument.createdAt.toISOString(),
  };
}
