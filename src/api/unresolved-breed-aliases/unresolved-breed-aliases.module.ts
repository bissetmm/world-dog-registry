import { Module } from "@nestjs/common";
import { UnresolvedBreedAliasesController } from "./unresolved-breed-aliases.controller";
import { UnresolvedBreedAliasesService } from "./unresolved-breed-aliases.service";

@Module({
  controllers: [UnresolvedBreedAliasesController],
  providers: [UnresolvedBreedAliasesService],
})
export class UnresolvedBreedAliasesModule {}
