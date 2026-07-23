import { AkcPopularityRankingParser } from "./akc-popularity-ranking.parser";

describe("AkcPopularityRankingParser", () => {
  it("parses ranking rows from AKC official text content", () => {
    const parser = new AkcPopularityRankingParser();
    const rows = parser.parse(
      `
        <main>
          <h1>The Most Popular Dog Breeds of 2025</h1>
          <h2>Most Popular Dog Breeds of 2025 Full List</h2>
          <p>Rank Breed</p>
          <p>1 French Bulldog</p>
          <p>2 Labrador Retriever</p>
          <p>3 Golden Retriever</p>
          <p>56 Chesapeake Bay Retriever</p>
          <p>69 Nova Scotia Duck Tolling Retriever</p>
          <p>98 Flat-Coated Retriever</p>
          <p>168 Curly-Coated Retriever</p>
        </main>
      `,
      2025,
    );

    expect(rows).toEqual([
      {
        sourceClubCode: "AKC",
        year: 2025,
        breedName: "French Bulldog",
        rank: 1,
        rawText: "1 French Bulldog",
      },
      {
        sourceClubCode: "AKC",
        year: 2025,
        breedName: "Labrador Retriever",
        rank: 2,
        rawText: "2 Labrador Retriever",
      },
      {
        sourceClubCode: "AKC",
        year: 2025,
        breedName: "Golden Retriever",
        rank: 3,
        rawText: "3 Golden Retriever",
      },
      {
        sourceClubCode: "AKC",
        year: 2025,
        breedName: "Chesapeake Bay Retriever",
        rank: 56,
        rawText: "56 Chesapeake Bay Retriever",
      },
      {
        sourceClubCode: "AKC",
        year: 2025,
        breedName: "Nova Scotia Duck Tolling Retriever",
        rank: 69,
        rawText: "69 Nova Scotia Duck Tolling Retriever",
      },
      {
        sourceClubCode: "AKC",
        year: 2025,
        breedName: "Flat-Coated Retriever",
        rank: 98,
        rawText: "98 Flat-Coated Retriever",
      },
      {
        sourceClubCode: "AKC",
        year: 2025,
        breedName: "Curly-Coated Retriever",
        rank: 168,
        rawText: "168 Curly-Coated Retriever",
      },
    ]);
  });

  it("keeps the first row for duplicated ranks", () => {
    const parser = new AkcPopularityRankingParser();
    const rows = parser.parse(
      `
        <p>1 French Bulldog</p>
        <p>1 French Bulldog</p>
      `,
      2025,
    );

    expect(rows).toHaveLength(1);
  });

  it("parses ranking rows from AKC official table content", () => {
    const parser = new AkcPopularityRankingParser();
    const rows = parser.parse(
      `
        <h2>Most Popular Dog Breeds of 2025 Full List</h2>
        <table>
          <tbody>
            <tr><td><strong>Rank</strong></td><td><strong>Breed</strong></td></tr>
            <tr><td><strong>2</strong></td><td>Labrador Retriever</td></tr>
            <tr><td><strong>3</strong></td><td>Golden Retriever</td></tr>
            <tr><td><strong>98</strong></td><td>Flat-Coated Retriever</td></tr>
          </tbody>
        </table>
      `,
      2025,
    );

    expect(rows).toEqual([
      {
        sourceClubCode: "AKC",
        year: 2025,
        breedName: "Labrador Retriever",
        rank: 2,
        rawText: "2 | Labrador Retriever",
      },
      {
        sourceClubCode: "AKC",
        year: 2025,
        breedName: "Golden Retriever",
        rank: 3,
        rawText: "3 | Golden Retriever",
      },
      {
        sourceClubCode: "AKC",
        year: 2025,
        breedName: "Flat-Coated Retriever",
        rank: 98,
        rawText: "98 | Flat-Coated Retriever",
      },
    ]);
  });

  it("parses older AKC text rows where breed names precede ranks", () => {
    const parser = new AkcPopularityRankingParser();
    const rows = parser.parse(
      `
        <main>
          <h1>Most Popular Dog Breeds of 2021</h1>
          <p>BREED 2021</p>
          <p>Retrievers (Labrador) 1</p>
          <p>Retrievers (Golden) 3</p>
          <p>Retrievers (Chesapeake Bay) 48</p>
          <p>Retrievers (Nova Scotia Duck Tolling) 92</p>
          <p>Retrievers (Flat-Coated) 93</p>
          <p>Retrievers (Curly-Coated) 167</p>
        </main>
      `,
      2021,
    );

    expect(rows).toEqual([
      {
        sourceClubCode: "AKC",
        year: 2021,
        breedName: "Retrievers (Labrador)",
        rank: 1,
        rawText: "Retrievers (Labrador) 1",
      },
      {
        sourceClubCode: "AKC",
        year: 2021,
        breedName: "Retrievers (Golden)",
        rank: 3,
        rawText: "Retrievers (Golden) 3",
      },
      {
        sourceClubCode: "AKC",
        year: 2021,
        breedName: "Retrievers (Chesapeake Bay)",
        rank: 48,
        rawText: "Retrievers (Chesapeake Bay) 48",
      },
      {
        sourceClubCode: "AKC",
        year: 2021,
        breedName: "Retrievers (Nova Scotia Duck Tolling)",
        rank: 92,
        rawText: "Retrievers (Nova Scotia Duck Tolling) 92",
      },
      {
        sourceClubCode: "AKC",
        year: 2021,
        breedName: "Retrievers (Flat-Coated)",
        rank: 93,
        rawText: "Retrievers (Flat-Coated) 93",
      },
      {
        sourceClubCode: "AKC",
        year: 2021,
        breedName: "Retrievers (Curly-Coated)",
        rank: 167,
        rawText: "Retrievers (Curly-Coated) 167",
      },
    ]);
  });

  it("parses older AKC table rows where breed names precede ranks", () => {
    const parser = new AkcPopularityRankingParser();
    const rows = parser.parse(
      `
        <table>
          <tbody>
            <tr><td>Breed</td><td>2020 Rank</td></tr>
            <tr><td>Retrievers (Labrador)</td><td>1</td></tr>
            <tr><td>Retrievers (Flat-Coated)</td><td>102</td></tr>
          </tbody>
        </table>
      `,
      2020,
    );

    expect(rows).toEqual([
      {
        sourceClubCode: "AKC",
        year: 2020,
        breedName: "Retrievers (Labrador)",
        rank: 1,
        rawText: "Retrievers (Labrador) | 1",
      },
      {
        sourceClubCode: "AKC",
        year: 2020,
        breedName: "Retrievers (Flat-Coated)",
        rank: 102,
        rawText: "Retrievers (Flat-Coated) | 102",
      },
    ]);
  });
});
