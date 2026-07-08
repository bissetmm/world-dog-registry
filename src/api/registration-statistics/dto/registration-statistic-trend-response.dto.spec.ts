import { RegistrationStatistic } from "@prisma/client";
import { toRegistrationStatisticTrendResponseDto } from "./registration-statistic-trend-response.dto";

describe("toRegistrationStatisticTrendResponseDto", () => {
  it("aggregates rows for the same breed, year, and source document", () => {
    const statistics = [
      buildStatistic({
        registrationCount: 312,
        rank: 42,
        rawBreedName: "フラットコーテッド・レトリーバー",
      }),
      buildStatistic({
        registrationCount: 1,
        rank: 999,
        rawBreedName: "未解決サンプル犬種",
      }),
    ];

    expect(toRegistrationStatisticTrendResponseDto(statistics)).toEqual([
      {
        breedId: "breed-1",
        kennelClubId: "kennel-club-1",
        countryCode: "JP",
        points: [
          {
            year: 2024,
            registrationCount: 313,
            rank: 42,
            sourceDocumentId: "source-document-1",
            sourceUrl: null,
            sourceTitle: null,
          },
        ],
      },
    ]);
  });
});

function buildStatistic(
  overrides: Partial<RegistrationStatistic>,
): RegistrationStatistic {
  return {
    id: "statistic-1",
    breedId: "breed-1",
    kennelClubId: "kennel-club-1",
    sourceDocumentId: "source-document-1",
    countryCode: "JP",
    year: 2024,
    registrationCount: 0,
    rank: null,
    previousYearDifference: null,
    rawBreedName: null,
    note: null,
    createdAt: new Date("2026-07-07T00:00:00.000Z"),
    updatedAt: new Date("2026-07-07T00:00:00.000Z"),
    ...overrides,
  };
}
