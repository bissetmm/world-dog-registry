import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { UnresolvedAliasStatus } from "@prisma/client";
import { BreedAliasRepository } from "../../database/repositories/breed-alias.repository";
import { BreedRepository } from "../../database/repositories/breed.repository";
import { KennelClubRepository } from "../../database/repositories/kennel-club.repository";
import { UnresolvedBreedAliasRepository } from "../../database/repositories/unresolved-breed-alias.repository";
import { ResolveUnresolvedBreedAliasRequestDto } from "./dto/resolve-unresolved-breed-alias-request.dto";
import {
  UnresolvedBreedAliasResponseDto,
  toUnresolvedBreedAliasResponseDto,
} from "./dto/unresolved-breed-alias-response.dto";

@Injectable()
export class UnresolvedBreedAliasesService {
  constructor(
    private readonly unresolvedBreedAliasRepository: UnresolvedBreedAliasRepository,
    private readonly breedRepository: BreedRepository,
    private readonly breedAliasRepository: BreedAliasRepository,
    private readonly kennelClubRepository: KennelClubRepository,
  ) {}

  async findMany(params: {
    kennelClubCode?: string;
    status?: UnresolvedAliasStatus;
  }): Promise<UnresolvedBreedAliasResponseDto[]> {
    const unresolvedBreedAliases =
      await this.unresolvedBreedAliasRepository.findMany(params);

    return unresolvedBreedAliases.map(toUnresolvedBreedAliasResponseDto);
  }

  async findById(id: string): Promise<UnresolvedBreedAliasResponseDto> {
    const unresolvedBreedAlias =
      await this.unresolvedBreedAliasRepository.findById(id);

    if (!unresolvedBreedAlias) {
      throw new NotFoundException(`UnresolvedBreedAlias not found: ${id}`);
    }

    return toUnresolvedBreedAliasResponseDto(unresolvedBreedAlias);
  }

  async resolve(
    id: string,
    request: ResolveUnresolvedBreedAliasRequestDto,
  ): Promise<UnresolvedBreedAliasResponseDto> {
    if (!request.breedId) {
      throw new BadRequestException("breedId is required");
    }

    const unresolvedBreedAlias =
      await this.unresolvedBreedAliasRepository.findById(id);

    if (!unresolvedBreedAlias) {
      throw new NotFoundException(`UnresolvedBreedAlias not found: ${id}`);
    }

    if (unresolvedBreedAlias.status !== UnresolvedAliasStatus.unresolved) {
      throw new ConflictException(
        `UnresolvedBreedAlias is already ${unresolvedBreedAlias.status}`,
      );
    }

    const breed = await this.breedRepository.findById(request.breedId);

    if (!breed) {
      throw new NotFoundException(`Breed not found: ${request.breedId}`);
    }

    const kennelClub = await this.kennelClubRepository.findByCode(
      unresolvedBreedAlias.kennelClubCode,
    );

    if (!kennelClub) {
      throw new NotFoundException(
        `KennelClub not found: ${unresolvedBreedAlias.kennelClubCode}`,
      );
    }

    const aliasName = request.aliasName?.trim()
      ? request.aliasName.trim()
      : unresolvedBreedAlias.rawBreedName;
    const existingAlias =
      await this.breedAliasRepository.findByKennelClubAndAlias({
        kennelClubId: kennelClub.id,
        aliasName,
      });

    if (existingAlias && existingAlias.breedId !== breed.id) {
      throw new ConflictException(
        `BreedAlias already maps to another Breed: ${aliasName}`,
      );
    }

    const breedAlias =
      existingAlias ??
      (await this.breedAliasRepository.create({
        breed: { connect: { id: breed.id } },
        kennelClub: { connect: { id: kennelClub.id } },
        aliasName,
        languageCode: request.languageCode,
        sourceType: "manual_resolution",
      }));

    const resolvedBreedAlias =
      await this.unresolvedBreedAliasRepository.markResolved({
        id: unresolvedBreedAlias.id,
        resolvedBreedId: breed.id,
        resolvedAliasId: breedAlias.id,
        note:
          request.note ??
          `Resolved to ${breed.nameEn} via alias ${breedAlias.aliasName}`,
      });

    return toUnresolvedBreedAliasResponseDto(resolvedBreedAlias);
  }
}
