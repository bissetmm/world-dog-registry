import { UnresolvedAliasStatus, UnresolvedBreedAlias } from "@prisma/client";

export type UnresolvedBreedAliasResponseDto = {
  id: string;
  kennelClubCode: string;
  rawBreedName: string;
  year: number | null;
  sourceDocumentId: string | null;
  status: UnresolvedAliasStatus;
  resolvedBreedId: string | null;
  resolvedAliasId: string | null;
  resolvedAt: string | null;
  note: string | null;
  createdAt: string;
};

export function toUnresolvedBreedAliasResponseDto(
  unresolvedBreedAlias: UnresolvedBreedAlias,
): UnresolvedBreedAliasResponseDto {
  return {
    id: unresolvedBreedAlias.id,
    kennelClubCode: unresolvedBreedAlias.kennelClubCode,
    rawBreedName: unresolvedBreedAlias.rawBreedName,
    year: unresolvedBreedAlias.year,
    sourceDocumentId: unresolvedBreedAlias.sourceDocumentId,
    status: unresolvedBreedAlias.status,
    resolvedBreedId: unresolvedBreedAlias.resolvedBreedId,
    resolvedAliasId: unresolvedBreedAlias.resolvedAliasId,
    resolvedAt: unresolvedBreedAlias.resolvedAt?.toISOString() ?? null,
    note: unresolvedBreedAlias.note,
    createdAt: unresolvedBreedAlias.createdAt.toISOString(),
  };
}
