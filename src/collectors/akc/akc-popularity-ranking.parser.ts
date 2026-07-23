import { Injectable } from "@nestjs/common";
import * as cheerio from "cheerio";

export type ParsedPopularityRankingRow = {
  sourceClubCode: "AKC";
  year: number;
  breedName: string;
  rank: number;
  rawText?: string;
};

@Injectable()
export class AkcPopularityRankingParser {
  parse(content: string, year: number): ParsedPopularityRankingRow[] {
    const $ = cheerio.load(content);
    const seenRanks = new Set<number>();
    const rows = this.parseTableRows($, year);

    if (rows.length === 0) {
      rows.push(
        ...$.root()
          .text()
          .split("\n")
          .map((line) => line.replace(/\s+/g, " ").trim())
          .map((line) => this.parseTextLine(line, year))
          .filter((row): row is ParsedPopularityRankingRow => row !== null),
      );
    }

    return rows.filter((row) => {
      if (seenRanks.has(row.rank)) {
        return false;
      }

      seenRanks.add(row.rank);
      return true;
    });
  }

  private parseTableRows(
    $: cheerio.CheerioAPI,
    year: number,
  ): ParsedPopularityRankingRow[] {
    const rows: ParsedPopularityRankingRow[] = [];

    $("tr").each((_, element) => {
      const cells = $(element)
        .find("td, th")
        .toArray()
        .map((cell) => $(cell).text().replace(/\s+/g, " ").trim());

      if (cells.length < 2 || cells[0].toLowerCase() === "rank") {
        return;
      }

      const rankingCell = this.extractRankAndBreed(cells[0], cells[1]);

      if (!rankingCell) {
        return;
      }

      rows.push({
        sourceClubCode: "AKC",
        year,
        breedName: rankingCell.breedName,
        rank: rankingCell.rank,
        rawText: cells.slice(0, 2).join(" | "),
      });
    });

    return rows;
  }

  private parseTextLine(
    line: string,
    year: number,
  ): ParsedPopularityRankingRow | null {
    const rankFirstMatch = line.match(/^(\d{1,3})\s+(.+)$/);

    if (rankFirstMatch) {
      return this.createRow({
        breedName: rankFirstMatch[2],
        rankText: rankFirstMatch[1],
        rawText: line,
        year,
      });
    }

    const breedFirstMatch = line.match(/^(.+?)\s+(\d{1,3})$/);

    if (!breedFirstMatch) {
      return null;
    }

    return this.createRow({
      breedName: breedFirstMatch[1],
      rankText: breedFirstMatch[2],
      rawText: line,
      year,
    });
  }

  private extractRankAndBreed(
    firstCell: string,
    secondCell: string,
  ): { rank: number; breedName: string } | null {
    const rankFirst = this.parseRankAndBreed(firstCell, secondCell);

    if (rankFirst) {
      return rankFirst;
    }

    return this.parseRankAndBreed(secondCell, firstCell);
  }

  private parseRankAndBreed(
    rankText: string,
    breedName: string,
  ): { rank: number; breedName: string } | null {
    const rank = Number(rankText);
    const normalizedBreedName = breedName.trim();

    if (!Number.isInteger(rank) || this.shouldSkipBreedName(normalizedBreedName)) {
      return null;
    }

    return { rank, breedName: normalizedBreedName };
  }

  private createRow(input: {
    breedName: string;
    rankText: string;
    rawText: string;
    year: number;
  }): ParsedPopularityRankingRow | null {
    const parsed = this.parseRankAndBreed(input.rankText, input.breedName);

    if (!parsed) {
      return null;
    }

    return {
      sourceClubCode: "AKC",
      year: input.year,
      breedName: parsed.breedName,
      rank: parsed.rank,
      rawText: input.rawText,
    };
  }

  private shouldSkipBreedName(breedName: string): boolean {
    return (
      breedName.length === 0 ||
      breedName === "Rank Breed" ||
      breedName === "Breed 2020 Rank" ||
      breedName === "BREED 2021" ||
      breedName.includes("Top 10 Dog Breeds")
    );
  }
}
