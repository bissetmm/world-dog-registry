import { Injectable } from "@nestjs/common";
import { HtmlTableParser } from "../../parsers/html-table.parser";
import { ParsedRegistrationRow } from "../../parsers/parsed-registration-row.type";
import { mapRegistrationTable } from "../../parsers/registration-table-mapper";
import { RegistrationStatisticsParser } from "../../parsers/registration-statistics-parser.interface";

@Injectable()
export class RoyalKennelClubRegistrationStatisticsParser implements RegistrationStatisticsParser {
  private readonly htmlTableParser = new HtmlTableParser();

  parse(content: string, year: number): ParsedRegistrationRow[] {
    return this.htmlTableParser.parseTables(content).flatMap((table) =>
      mapRegistrationTable({
        ...table,
        year,
        sourceClubCode: "RKC",
        columns: {
          breedName: ["breed", "breed name"],
          registrationCount: [
            "registrations",
            "registration count",
            "number registered",
          ],
          rank: ["rank", "position"],
          previousYearDifference: [
            "change",
            "difference",
            "previous year difference",
            "compared with previous year",
          ],
        },
      }),
    );
  }
}
