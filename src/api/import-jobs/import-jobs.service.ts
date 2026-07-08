import { Injectable, NotFoundException } from "@nestjs/common";
import { ImportJobStatus } from "@prisma/client";
import { ImportJobRepository } from "../../database/repositories/import-job.repository";
import {
  ImportJobResponseDto,
  toImportJobResponseDto,
} from "./dto/import-job-response.dto";

@Injectable()
export class ImportJobsService {
  constructor(private readonly importJobRepository: ImportJobRepository) {}

  async findMany(params: {
    kennelClubCode?: string;
    status?: ImportJobStatus;
  }): Promise<ImportJobResponseDto[]> {
    const importJobs = await this.importJobRepository.findMany(params);
    return importJobs.map(toImportJobResponseDto);
  }

  async findById(id: string): Promise<ImportJobResponseDto> {
    const importJob = await this.importJobRepository.findById(id);

    if (!importJob) {
      throw new NotFoundException(`ImportJob not found: ${id}`);
    }

    return toImportJobResponseDto(importJob);
  }
}
