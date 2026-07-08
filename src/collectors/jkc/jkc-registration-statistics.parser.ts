import { Injectable } from "@nestjs/common";
import * as cheerio from "cheerio";
import { HtmlTableParser } from "../../parsers/html-table.parser";
import { ParsedRegistrationRow } from "../../parsers/parsed-registration-row.type";
import { mapRegistrationTable } from "../../parsers/registration-table-mapper";
import { RegistrationStatisticsParser } from "../../parsers/registration-statistics-parser.interface";

@Injectable()
export class JkcRegistrationStatisticsParser implements RegistrationStatisticsParser {
  private readonly htmlTableParser = new HtmlTableParser();

  parse(content: string, year: number): ParsedRegistrationRow[] {
    const tableRows = this.htmlTableParser
      .parseTables(content)
      .flatMap((table) =>
        mapRegistrationTable({
          ...table,
          year,
          sourceClubCode: "JKC",
          columns: {
            breedName: ["犬種", "犬種名", "breed", "breed name"],
            registrationCount: ["登録頭数", "登録数", "頭数", "registrations"],
            rank: ["順位", "rank"],
          },
        }),
      );

    if (tableRows.length > 0) {
      return tableRows;
    }

    return this.parseTextRows(content, year);
  }

  private parseTextRows(
    content: string,
    year: number,
  ): ParsedRegistrationRow[] {
    const $ = cheerio.load(content);
    const text = $.root().text();

    return text
      .split("\n")
      .map((line) => line.replace(/\s+/g, " ").trim())
      .map((line) => this.parseTextLine(line, year))
      .filter((row): row is ParsedRegistrationRow => row !== null);
  }

  private parseTextLine(
    line: string,
    year: number,
  ): ParsedRegistrationRow | null {
    if (!line || line.includes("犬種別犬籍登録頭数")) {
      return null;
    }

    const match = line.match(/^(\d{1,3})\s+(.+?)\s*([\d,]+)$/);

    if (!match) {
      return null;
    }

    const rank = Number(match[1]);
    const breedName = match[2].trim();
    const registrationCount = Number(match[3].replace(/,/g, ""));

    if (
      !Number.isInteger(rank) ||
      !Number.isInteger(registrationCount) ||
      breedName.includes("順位") ||
      breedName.includes("合計") ||
      breedName.includes("犬種")
    ) {
      return null;
    }

    return {
      sourceClubCode: "JKC",
      year,
      breedName,
      registrationCount,
      rank,
      rawText: line,
    };
  }
}
