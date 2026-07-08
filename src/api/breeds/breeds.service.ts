import { Injectable, NotFoundException } from "@nestjs/common";
import { BreedAliasRepository } from "../../database/repositories/breed-alias.repository";
import { BreedRepository } from "../../database/repositories/breed.repository";
import {
  BreedAliasResponseDto,
  toBreedAliasResponseDto,
} from "./dto/breed-alias-response.dto";
import { BreedResponseDto, toBreedResponseDto } from "./dto/breed-response.dto";

@Injectable()
export class BreedsService {
  constructor(
    private readonly breedRepository: BreedRepository,
    private readonly breedAliasRepository: BreedAliasRepository,
  ) {}

  async findMany(search?: string): Promise<BreedResponseDto[]> {
    const breeds = await this.breedRepository.findMany({ search });
    return breeds.map(toBreedResponseDto);
  }

  async findById(id: string): Promise<BreedResponseDto> {
    const breed = await this.breedRepository.findById(id);

    if (!breed) {
      throw new NotFoundException(`Breed not found: ${id}`);
    }

    return toBreedResponseDto(breed);
  }

  async findAliases(id: string): Promise<BreedAliasResponseDto[]> {
    const breed = await this.breedRepository.findById(id);

    if (!breed) {
      throw new NotFoundException(`Breed not found: ${id}`);
    }

    const aliases = await this.breedAliasRepository.findManyByBreedId(id);
    return aliases.map(toBreedAliasResponseDto);
  }
}
