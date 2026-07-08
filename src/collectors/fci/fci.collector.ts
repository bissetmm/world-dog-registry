import { Injectable } from "@nestjs/common";
import { CollectOptions } from "../common/collect-options.type";
import { CollectResult } from "../common/collect-result.type";
import { SourceCollector } from "../common/source-collector.interface";

@Injectable()
export class FciCollector implements SourceCollector {
  collect(options: CollectOptions): Promise<CollectResult> {
    return Promise.resolve({
      rowsParsed: 0,
      rowsImported: 0,
      unresolvedBreedAliases: 0,
      warnings: [
        `FCI collector skeleton is ready for year ${options.year ?? "unknown"}`,
      ],
      errors: [],
    });
  }
}
