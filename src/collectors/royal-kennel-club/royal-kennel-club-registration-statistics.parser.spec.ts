import { RoyalKennelClubRegistrationStatisticsParser } from "./royal-kennel-club-registration-statistics.parser";

describe("RoyalKennelClubRegistrationStatisticsParser", () => {
  it("parses registration rows and previous-year differences", () => {
    const parser = new RoyalKennelClubRegistrationStatisticsParser();
    const rows = parser.parse(
      `
        <table>
          <tr>
            <th>Rank</th>
            <th>Breed</th>
            <th>Registrations</th>
            <th>Change</th>
          </tr>
          <tr><td>1</td><td>Labrador Retriever</td><td>44,311</td><td>+210</td></tr>
          <tr><td>96</td><td>Flat Coated Retriever</td><td>1,011</td><td>−32</td></tr>
        </table>
      `,
      2024,
    );

    expect(rows).toEqual([
      {
        sourceClubCode: "RKC",
        year: 2024,
        breedName: "Labrador Retriever",
        registrationCount: 44311,
        rank: 1,
        previousYearDifference: 210,
        rawText: "1 | Labrador Retriever | 44,311 | +210",
      },
      {
        sourceClubCode: "RKC",
        year: 2024,
        breedName: "Flat Coated Retriever",
        registrationCount: 1011,
        rank: 96,
        previousYearDifference: -32,
        rawText: "96 | Flat Coated Retriever | 1,011 | −32",
      },
    ]);
  });
});
