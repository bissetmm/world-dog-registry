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

      const rank = Number(cells[0]);
      const breedName = cells[1];

      if (!Number.isInteger(rank) || !breedName) {
        return;
      }

      rows.push({
        sourceClubCode: "AKC",
        year,
        breedName,
        rank,
        rawText: cells.slice(0, 2).join(" | "),
      });
    });

    return rows;
  }

  private parseTextLine(
    line: string,
    year: number,
  ): ParsedPopularityRankingRow | null {
    const match = line.match(/^(\d{1,3})\s+(.+)$/);

    if (!match) {
      return null;
    }

    const rank = Number(match[1]);
    const breedName = match[2].trim();

    if (
      !Number.isInteger(rank) ||
      breedName.length === 0 ||
      breedName === "Rank Breed" ||
      breedName.includes("Top 10 Dog Breeds")
    ) {
      return null;
    }

    return {
      sourceClubCode: "AKC",
      year,
      breedName,
      rank,
      rawText: line,
    };
  }
}
