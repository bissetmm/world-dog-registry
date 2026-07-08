import { ParsedPopularityRankingRow } from "../collectors/akc/akc-popularity-ranking.parser";

export type NormalizedPopularityRankingRow = ParsedPopularityRankingRow & {
  breedId: string | null;
  unresolvedReason?: string;
};
