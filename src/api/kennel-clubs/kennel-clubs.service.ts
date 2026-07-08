import { Injectable } from "@nestjs/common";
import { KennelClubRepository } from "../../database/repositories/kennel-club.repository";
import {
  KennelClubResponseDto,
  toKennelClubResponseDto,
} from "./dto/kennel-club-response.dto";

@Injectable()
export class KennelClubsService {
  constructor(private readonly kennelClubRepository: KennelClubRepository) {}

  async findMany(): Promise<KennelClubResponseDto[]> {
    const kennelClubs = await this.kennelClubRepository.findMany();
    return kennelClubs.map(toKennelClubResponseDto);
  }
}
