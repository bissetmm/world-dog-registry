export type PopularityTrendSourceType =
  "registration_statistic" | "popularity_ranking";

export type PopularityTrendPointDto = {
  year: number;
  rank: number;
  sourceDocumentId: string | null;
  sourceType: PopularityTrendSourceType;
};

export type PopularityTrendResponseDto = {
  breedId: string;
  kennelClubId: string;
  kennelClubCode: string;
  countryCode: string;
  points: PopularityTrendPointDto[];
};
