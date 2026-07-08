import { BreedAlias } from "@prisma/client";

export type BreedAliasResponseDto = {
  id: string;
  breedId: string;
  kennelClubId: string | null;
  aliasName: string;
  languageCode: string | null;
  sourceType: string | null;
};

export function toBreedAliasResponseDto(
  breedAlias: BreedAlias,
): BreedAliasResponseDto {
  return {
    id: breedAlias.id,
    breedId: breedAlias.breedId,
    kennelClubId: breedAlias.kennelClubId,
    aliasName: breedAlias.aliasName,
    languageCode: breedAlias.languageCode,
    sourceType: breedAlias.sourceType,
  };
}
