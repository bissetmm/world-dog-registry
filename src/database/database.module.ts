import { Global, Module } from "@nestjs/common";
import { BreedAliasRepository } from "./repositories/breed-alias.repository";
import { BreedRepository } from "./repositories/breed.repository";
import { ImportJobRepository } from "./repositories/import-job.repository";
import { KennelClubRepository } from "./repositories/kennel-club.repository";
import { PopularityRankingRepository } from "./repositories/popularity-ranking.repository";
import { RegistrationStatisticRepository } from "./repositories/registration-statistic.repository";
import { SourceDocumentRepository } from "./repositories/source-document.repository";
import { UnresolvedBreedAliasRepository } from "./repositories/unresolved-breed-alias.repository";
import { PrismaService } from "./prisma.service";

@Global()
@Module({
  providers: [
    PrismaService,
    BreedAliasRepository,
    BreedRepository,
    KennelClubRepository,
    PopularityRankingRepository,
    ImportJobRepository,
    RegistrationStatisticRepository,
    SourceDocumentRepository,
    UnresolvedBreedAliasRepository,
  ],
  exports: [
    PrismaService,
    BreedAliasRepository,
    BreedRepository,
    KennelClubRepository,
    PopularityRankingRepository,
    ImportJobRepository,
    RegistrationStatisticRepository,
    SourceDocumentRepository,
    UnresolvedBreedAliasRepository,
  ],
})
export class DatabaseModule {}
