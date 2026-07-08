import { Module } from "@nestjs/common";
import { KennelClubsController } from "./kennel-clubs.controller";
import { KennelClubsService } from "./kennel-clubs.service";

@Module({
  controllers: [KennelClubsController],
  providers: [KennelClubsService],
})
export class KennelClubsModule {}
