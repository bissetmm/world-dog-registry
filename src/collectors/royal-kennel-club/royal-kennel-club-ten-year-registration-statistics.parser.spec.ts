import { RoyalKennelClubTenYearRegistrationStatisticsParser } from "./royal-kennel-club-ten-year-registration-statistics.parser";

describe("RoyalKennelClubTenYearRegistrationStatisticsParser", () => {
  it("expands ten-year RKC gundog statistics into yearly rows", () => {
    const parser = new RoyalKennelClubTenYearRegistrationStatisticsParser();
    const rows = parser.parseText(`
      COMPARATIVE TABLES OF REGISTRATIONS FOR THE YEARS 2016 - 2025 INCLUSIVE
      GUNDOG 2016 2017 2018 2019 2020 2021 2022 2023 2024 2025
      Retriever (Flat Coated) 1,348 1,098 1,146 1,171 1,068 1,544 1,141 958 869 764
      Retriever (Golden) 7,232 7,846 7,794 8,422 8,653 11,808 11,075 10,447 10,201 9,976
      TOTAL 84,780 88,829 91,194 86,035 95,652 144,265 107,561 92,670 83,027 74,960
    `);

    expect(rows).toHaveLength(20);
    expect(rows.slice(0, 2)).toEqual([
      {
        sourceClubCode: "RKC",
        year: 2016,
        breedName: "Retriever (Flat Coated)",
        registrationCount: 1348,
        rawText:
          "Retriever (Flat Coated) 1,348 1,098 1,146 1,171 1,068 1,544 1,141 958 869 764",
      },
      {
        sourceClubCode: "RKC",
        year: 2017,
        breedName: "Retriever (Flat Coated)",
        registrationCount: 1098,
        rawText:
          "Retriever (Flat Coated) 1,348 1,098 1,146 1,171 1,068 1,544 1,141 958 869 764",
      },
    ]);
    expect(rows.at(-1)).toEqual({
      sourceClubCode: "RKC",
      year: 2025,
      breedName: "Retriever (Golden)",
      registrationCount: 9976,
      rawText:
        "Retriever (Golden) 7,232 7,846 7,794 8,422 8,653 11,808 11,075 10,447 10,201 9,976",
    });
  });
});
