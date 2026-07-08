export type CollectResult = {
  importJobId?: string;
  sourceDocumentId?: string;
  rowsParsed: number;
  rowsImported: number;
  unresolvedBreedAliases: number;
  warnings: string[];
  errors: string[];
};
