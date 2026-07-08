export type DownloadedFile = {
  sourceUrl: string;
  content: Buffer;
  contentType?: string;
  retrievedAt: Date;
};
