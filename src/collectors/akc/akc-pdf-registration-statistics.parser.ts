import { Injectable } from "@nestjs/common";
import { ParsedRegistrationRow } from "../../parsers/parsed-registration-row.type";

@Injectable()
export class AkcPdfRegistrationStatisticsParser {
  parse(_content: Buffer, _year: number): ParsedRegistrationRow[] {
    return [];
  }
}
