import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Injectable } from "@nestjs/common";
import { SourceClubCode } from "../shared/types/source-club-code.type";

export type SaveRawFileInput = {
  sourceClubCode: SourceClubCode;
  year?: number;
  fileName: string;
  content: Buffer;
};

@Injectable()
export class RawFileStorageService {
  async save(input: SaveRawFileInput): Promise<string> {
    const directory = join(
      process.cwd(),
      "storage",
      "raw",
      this.toStorageSegment(input.sourceClubCode),
      input.year ? String(input.year) : "unknown-year",
    );

    await mkdir(directory, { recursive: true });

    const filePath = join(directory, input.fileName);
    await writeFile(filePath, input.content);

    return filePath;
  }

  private toStorageSegment(sourceClubCode: SourceClubCode): string {
    const segments: Record<SourceClubCode, string> = {
      JKC: "jkc",
      RKC: "royal-kennel-club",
      AKC: "akc",
      FCI: "fci",
    };

    return segments[sourceClubCode];
  }
}
