import { Controller, Get, Param, Query } from "@nestjs/common";
import { SourceDocumentResponseDto } from "./dto/source-document-response.dto";
import { SourceDocumentsService } from "./source-documents.service";

@Controller("source-documents")
export class SourceDocumentsController {
  constructor(
    private readonly sourceDocumentsService: SourceDocumentsService,
  ) {}

  @Get()
  findMany(
    @Query("kennelClubCode") kennelClubCode?: string,
    @Query("importJobId") importJobId?: string,
    @Query("year") year?: string,
  ): Promise<SourceDocumentResponseDto[]> {
    return this.sourceDocumentsService.findMany({
      kennelClubCode,
      importJobId,
      year: year ? Number(year) : undefined,
    });
  }

  @Get(":id")
  findById(@Param("id") id: string): Promise<SourceDocumentResponseDto> {
    return this.sourceDocumentsService.findById(id);
  }
}
