import { KennelClub } from "@prisma/client";

export type KennelClubResponseDto = {
  id: string;
  code: string;
  name: string;
  websiteUrl: string | null;
  supportsRegistration: boolean;
  supportsRanking: boolean;
  supportsBreedStandard: boolean;
  supportsBreedStatus: boolean;
  supportsApi: boolean;
  supportsHtml: boolean;
  supportsPdf: boolean;
};

export function toKennelClubResponseDto(
  kennelClub: KennelClub,
): KennelClubResponseDto {
  return {
    id: kennelClub.id,
    code: kennelClub.code,
    name: kennelClub.name,
    websiteUrl: kennelClub.websiteUrl,
    supportsRegistration: kennelClub.supportsRegistration,
    supportsRanking: kennelClub.supportsRanking,
    supportsBreedStandard: kennelClub.supportsBreedStandard,
    supportsBreedStatus: kennelClub.supportsBreedStatus,
    supportsApi: kennelClub.supportsApi,
    supportsHtml: kennelClub.supportsHtml,
    supportsPdf: kennelClub.supportsPdf,
  };
}
