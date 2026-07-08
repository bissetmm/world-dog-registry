import { Controller, Get } from "@nestjs/common";
import { KennelClubResponseDto } from "./dto/kennel-club-response.dto";
import { KennelClubsService } from "./kennel-clubs.service";

@Controller("kennel-clubs")
export class KennelClubsController {
  constructor(private readonly kennelClubsService: KennelClubsService) {}

  @Get()
  findMany(): Promise<KennelClubResponseDto[]> {
    return this.kennelClubsService.findMany();
  }
}
