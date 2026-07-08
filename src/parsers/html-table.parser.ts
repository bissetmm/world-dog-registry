import * as cheerio from "cheerio";

export type HtmlTable = {
  headers: string[];
  rows: string[][];
};

export class HtmlTableParser {
  parseTables(content: string): HtmlTable[] {
    const $ = cheerio.load(content);
    const tables: HtmlTable[] = [];

    $("table").each((_, tableElement) => {
      const rows = $(tableElement)
        .find("tr")
        .toArray()
        .map((rowElement) =>
          $(rowElement)
            .find("th, td")
            .toArray()
            .map((cellElement) => this.normalizeCellText($(cellElement).text()))
            .filter((cellText) => cellText.length > 0),
        )
        .filter((row) => row.length > 0);

      if (rows.length === 0) {
        return;
      }

      tables.push({
        headers: rows[0],
        rows: rows.slice(1),
      });
    });

    return tables;
  }

  private normalizeCellText(text: string): string {
    return text.replace(/\s+/g, " ").trim();
  }
}
