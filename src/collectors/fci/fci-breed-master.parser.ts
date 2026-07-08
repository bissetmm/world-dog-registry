import { Injectable } from "@nestjs/common";

export type ParsedFciBreedRow = {
  fciNumber: number;
  nameEn: string;
  groupName?: string;
  fciGroup?: string;
  origin?: string;
  standardUrl?: string;
};

@Injectable()
export class FciBreedMasterParser {
  parse(_content: string): ParsedFciBreedRow[] {
    return [];
  }
}
