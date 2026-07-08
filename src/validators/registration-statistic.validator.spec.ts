import { RegistrationStatisticValidator } from "./registration-statistic.validator";

describe("RegistrationStatisticValidator", () => {
  const validator = new RegistrationStatisticValidator();

  it("keeps valid normalized rows", () => {
    const result = validator.validate([
      {
        sourceClubCode: "JKC",
        year: 2024,
        breedName: "Flat-Coated Retriever",
        registrationCount: 10,
        breedId: "breed-1",
      },
    ]);

    expect(result.validRows).toHaveLength(1);
    expect(result.errors).toHaveLength(0);
  });

  it("warns without importing unresolved breed aliases", () => {
    const result = validator.validate([
      {
        sourceClubCode: "RKC",
        year: 2024,
        breedName: "Unknown Breed",
        registrationCount: 1,
        breedId: null,
        unresolvedReason: "No matching Breed or BreedAlias",
      },
    ]);

    expect(result.validRows).toHaveLength(0);
    expect(result.warnings).toEqual([
      "Unresolved breed alias: RKC Unknown Breed",
    ]);
  });
});
