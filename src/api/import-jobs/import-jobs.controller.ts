import { Controller, Get, Param, Query } from "@nestjs/common";
import { ImportJobStatus } from "@prisma/client";
import { ImportJobResponseDto } from "./dto/import-job-response.dto";
import { ImportJobsService } from "./import-jobs.service";

@Controller("import-jobs")
export class ImportJobsController {
  constructor(private readonly importJobsService: ImportJobsService) {}

  @Get()
  findMany(
    @Query("kennelClubCode") kennelClubCode?: string,
    @Query("status") status?: ImportJobStatus,
  ): Promise<ImportJobResponseDto[]> {
    return this.importJobsService.findMany({ kennelClubCode, status });
  }

  @Get(":id")
  findById(@Param("id") id: string): Promise<ImportJobResponseDto> {
    return this.importJobsService.findById(id);
  }
}
