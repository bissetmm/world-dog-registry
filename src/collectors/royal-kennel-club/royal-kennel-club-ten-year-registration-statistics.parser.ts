import { Injectable } from "@nestjs/common";
import { PDFParse } from "pdf-parse";
import { ParsedRegistrationRow } from "../../parsers/parsed-registration-row.type";

@Injectable()
export class RoyalKennelClubTenYearRegistrationStatisticsParser {
  async parsePdf(content: Buffer): Promise<ParsedRegistrationRow[]> {
    const parser = new PDFParse({ data: content });

    try {
      const result = await parser.getText();
      return this.parseText(result.text);
    } finally {
      await parser.destroy();
    }
  }

  parseText(content: string): ParsedRegistrationRow[] {
    const years = this.parseYears(content);

    if (years.length === 0) {
      return [];
    }

    return content
      .split("\n")
      .map((line) => line.replace(/\s+/g, " ").trim())
      .flatMap((line) => this.parseBreedLine(line, years));
  }

  private parseYears(content: string): number[] {
    const headerMatch = content.match(
      /\b(?:HOUND|WORKING|TERRIER|GUNDOG|PASTORAL|UTILITY|TOY)\s+((?:20\d{2}\s+){2,}20\d{2})/i,
    );

    if (!headerMatch) {
      return [];
    }

    return [...headerMatch[1].matchAll(/20\d{2}/g)].map((match) =>
      Number(match[0]),
    );
  }

  private parseBreedLine(
    line: string,
    years: number[],
  ): ParsedRegistrationRow[] {
    if (
      !line ||
      /^(HOUND|WORKING|TERRIER|GUNDOG|PASTORAL|UTILITY|TOY)\s/i.test(line) ||
      line.startsWith("TOTAL ")
    ) {
      return [];
    }

    const values = [...line.matchAll(/\d[\d,]*/g)].map((match) => ({
      value: Number(match[0].replace(/,/g, "")),
      index: match.index ?? -1,
    }));

    if (values.length !== years.length) {
      return [];
    }

    const breedName = line.slice(0, values[0].index).trim();

    if (!breedName) {
      return [];
    }

    return values.map((value, index) => ({
      sourceClubCode: "RKC",
      year: years[index],
      breedName,
      registrationCount: value.value,
      rawText: line,
    }));
  }
}
