import { Injectable } from "@nestjs/common";
import { DownloadedFile } from "./downloaded-file.type";

@Injectable()
export class HttpDownloader {
  async download(sourceUrl: string): Promise<DownloadedFile> {
    const response = await fetch(sourceUrl);

    if (!response.ok) {
      throw new Error(
        `Failed to download ${sourceUrl}: ${response.status} ${response.statusText}`,
      );
    }

    const arrayBuffer = await response.arrayBuffer();

    return {
      sourceUrl,
      content: Buffer.from(arrayBuffer),
      contentType: response.headers.get("content-type") ?? undefined,
      retrievedAt: new Date(),
    };
  }
}
