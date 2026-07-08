import { Injectable, NotFoundException } from "@nestjs/common";
import { KennelClubRepository } from "../../database/repositories/kennel-club.repository";
import { SourceDocumentRepository } from "../../database/repositories/source-document.repository";
import {
  SourceDocumentResponseDto,
  toSourceDocumentResponseDto,
} from "./dto/source-document-response.dto";

@Injectable()
export class SourceDocumentsService {
  constructor(
    private readonly sourceDocumentRepository: SourceDocumentRepository,
    private readonly kennelClubRepository: KennelClubRepository,
  ) {}

  async findMany(params: {
    kennelClubCode?: string;
    importJobId?: string;
    year?: number;
  }): Promise<SourceDocumentResponseDto[]> {
    const kennelClub = params.kennelClubCode
      ? await this.kennelClubRepository.findByCode(params.kennelClubCode)
      : null;
    const sourceDocuments = await this.sourceDocumentRepository.findMany({
      kennelClubId: kennelClub?.id,
      importJobId: params.importJobId,
      year: params.year,
    });

    return sourceDocuments.map(toSourceDocumentResponseDto);
  }

  async findById(id: string): Promise<SourceDocumentResponseDto> {
    const sourceDocument = await this.sourceDocumentRepository.findById(id);

    if (!sourceDocument) {
      throw new NotFoundException(`SourceDocument not found: ${id}`);
    }

    return toSourceDocumentResponseDto(sourceDocument);
  }
}
