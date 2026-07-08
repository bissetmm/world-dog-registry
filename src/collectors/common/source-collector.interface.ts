import { CollectOptions } from "./collect-options.type";
import { CollectResult } from "./collect-result.type";

export interface SourceCollector {
  collect(options: CollectOptions): Promise<CollectResult>;
}
