import { Controller, Get, Param, Query } from "@nestjs/common";
import { BreedAliasResponseDto } from "./dto/breed-alias-response.dto";
import { BreedsService } from "./breeds.service";
import { BreedResponseDto } from "./dto/breed-response.dto";

@Controller("breeds")
export class BreedsController {
  constructor(private readonly breedsService: BreedsService) {}

  @Get()
  findMany(@Query("search") search?: string): Promise<BreedResponseDto[]> {
    return this.breedsService.findMany(search);
  }

  @Get(":id")
  findById(@Param("id") id: string): Promise<BreedResponseDto> {
    return this.breedsService.findById(id);
  }

  @Get(":id/aliases")
  findAliases(@Param("id") id: string): Promise<BreedAliasResponseDto[]> {
    return this.breedsService.findAliases(id);
  }
}
