import { createHash } from "node:crypto";
import { Injectable } from "@nestjs/common";

@Injectable()
export class ChecksumService {
  sha256(content: Buffer | string): string {
    return createHash("sha256").update(content).digest("hex");
  }
}
