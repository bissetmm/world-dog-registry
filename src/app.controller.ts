import { Controller, Get } from "@nestjs/common";

type ApiIndexResponseDto = {
  name: string;
  version: string;
  routes: string[];
};

@Controller()
export class AppController {
  @Get()
  getApiIndex(): ApiIndexResponseDto {
    return {
      name: "World Dog Statistics Platform API",
      version: "v1",
      routes: [
        "/api/v1/breeds",
        "/api/v1/breeds/:id/aliases",
        "/api/v1/dashboard",
        "/api/v1/kennel-clubs",
        "/api/v1/popularity-trends",
        "/api/v1/rankings",
        "/api/v1/rankings/trends",
        "/api/v1/registration-statistics",
        "/api/v1/registration-statistics/trends",
        "/api/v1/import-jobs",
        "/api/v1/source-documents",
        "/api/v1/unresolved-breed-aliases",
        "/api/v1/unresolved-breed-aliases/:id/resolve",
      ],
    };
  }
}
