import { JkcRegistrationStatisticsParser } from "./jkc-registration-statistics.parser";

describe("JkcRegistrationStatisticsParser", () => {
  it("parses registration rows from a JKC-style HTML table", () => {
    const parser = new JkcRegistrationStatisticsParser();
    const rows = parser.parse(
      `
        <table>
          <tr><th>順位</th><th>犬種名</th><th>登録頭数</th></tr>
          <tr><td>1</td><td>プードル</td><td>83,916</td></tr>
          <tr><td>42</td><td>フラットコーテッド・レトリーバー</td><td>312</td></tr>
        </table>
      `,
      2024,
    );

    expect(rows).toEqual([
      {
        sourceClubCode: "JKC",
        year: 2024,
        breedName: "プードル",
        registrationCount: 83916,
        rank: 1,
        rawText: "1 | プードル | 83,916",
      },
      {
        sourceClubCode: "JKC",
        year: 2024,
        breedName: "フラットコーテッド・レトリーバー",
        registrationCount: 312,
        rank: 42,
        rawText: "42 | フラットコーテッド・レトリーバー | 312",
      },
    ]);
  });

  it("parses registration rows from JKC official text content", () => {
    const parser = new JkcRegistrationStatisticsParser();
    const rows = parser.parse(
      `
        <main>
          <h2>2025年（1月～12月）犬種別犬籍登録頭数</h2>
          <p>順位 犬種 頭数</p>
          <p>11 ゴールデン・レトリーバー 7,472</p>
          <p>19 ラブラドール・レトリーバー 3,410</p>
          <p>42 フラットコーテッド・レトリーバー 257</p>
          <p>90 ノヴァ・スコシア・ダック・トーリング・レトリーバー 24</p>
          <p>141犬種 302,530頭</p>
        </main>
      `,
      2025,
    );

    expect(rows).toEqual([
      {
        sourceClubCode: "JKC",
        year: 2025,
        breedName: "ゴールデン・レトリーバー",
        registrationCount: 7472,
        rank: 11,
        rawText: "11 ゴールデン・レトリーバー 7,472",
      },
      {
        sourceClubCode: "JKC",
        year: 2025,
        breedName: "ラブラドール・レトリーバー",
        registrationCount: 3410,
        rank: 19,
        rawText: "19 ラブラドール・レトリーバー 3,410",
      },
      {
        sourceClubCode: "JKC",
        year: 2025,
        breedName: "フラットコーテッド・レトリーバー",
        registrationCount: 257,
        rank: 42,
        rawText: "42 フラットコーテッド・レトリーバー 257",
      },
      {
        sourceClubCode: "JKC",
        year: 2025,
        breedName: "ノヴァ・スコシア・ダック・トーリング・レトリーバー",
        registrationCount: 24,
        rank: 90,
        rawText: "90 ノヴァ・スコシア・ダック・トーリング・レトリーバー 24",
      },
    ]);
  });
});
