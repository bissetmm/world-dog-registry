import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { UnresolvedAliasStatus } from "@prisma/client";
import { ResolveUnresolvedBreedAliasRequestDto } from "./dto/resolve-unresolved-breed-alias-request.dto";
import { UnresolvedBreedAliasResponseDto } from "./dto/unresolved-breed-alias-response.dto";
import { UnresolvedBreedAliasesService } from "./unresolved-breed-aliases.service";

@Controller("unresolved-breed-aliases")
export class UnresolvedBreedAliasesController {
  constructor(
    private readonly unresolvedBreedAliasesService: UnresolvedBreedAliasesService,
  ) {}

  @Get()
  findMany(
    @Query("kennelClubCode") kennelClubCode?: string,
    @Query("status") status?: UnresolvedAliasStatus,
  ): Promise<UnresolvedBreedAliasResponseDto[]> {
    return this.unresolvedBreedAliasesService.findMany({
      kennelClubCode,
      status,
    });
  }

  @Get(":id")
  findById(@Param("id") id: string): Promise<UnresolvedBreedAliasResponseDto> {
    return this.unresolvedBreedAliasesService.findById(id);
  }

  @Post(":id/resolve")
  resolve(
    @Param("id") id: string,
    @Body() request: ResolveUnresolvedBreedAliasRequestDto,
  ): Promise<UnresolvedBreedAliasResponseDto> {
    return this.unresolvedBreedAliasesService.resolve(id, request);
  }
}
