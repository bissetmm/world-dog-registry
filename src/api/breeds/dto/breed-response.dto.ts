import { Breed } from "@prisma/client";

export type BreedResponseDto = {
  id: string;
  fciNumber: number | null;
  nameEn: string;
  nameJa: string | null;
  groupName: string | null;
  fciGroup: string | null;
  origin: string | null;
};

export function toBreedResponseDto(breed: Breed): BreedResponseDto {
  return {
    id: breed.id,
    fciNumber: breed.fciNumber,
    nameEn: breed.nameEn,
    nameJa: breed.nameJa,
    groupName: breed.groupName,
    fciGroup: breed.fciGroup,
    origin: breed.origin,
  };
}
