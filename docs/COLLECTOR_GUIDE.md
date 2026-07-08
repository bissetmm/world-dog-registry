# COLLECTOR_GUIDE.md

## 目的

このドキュメントは、各ケネルクラブの公開データを収集するための設計メモです。

団体ごとに以下を管理します。

- 取得対象
- URL
- データ形式
- 取得難易度
- 更新頻度
- Parser方針
- 注意事項

## JKC

正式名称: Japan Kennel Club  
コード: JKC  
国: JP

主な対象:

- 犬種別登録頭数
- 年別登録統計

形式:

- HTML

URL:

```text
https://www.jkc.or.jp/registr-statistics/#anchor
```

想定取得期間:

```text
1999年以降
```

取得難易度:

```text
低
```

特徴:

- HTML形式で公開されている
- 年度別の登録頭数を取得しやすい
- 日本語犬種名が中心
- 犬種名の正規化が重要

Collector名:

```text
JkcCollector
```

Parser名:

```text
JkcRegistrationStatisticsParser
```

保存先:

```text
storage/raw/jkc/{year}/
```

注意:

- 表構造が変更される可能性がある
- 犬種名の表記揺れに注意
- 日本語名からFCI/英語名へのマッピングが必要

## The Royal Kennel Club

正式名称: The Royal Kennel Club  
コード: RKC  
国: GB

主な対象:

- 犬種別登録頭数
- 前年比
- Vulnerable Native Breeds
- 希少犬種情報

形式:

- HTML

代表URL:

```text
https://www.thekennelclub.org.uk/media-centre/breed-registration-statistics/
```

想定取得期間:

```text
少なくとも近年データ
内部的には30年以上の登録データが存在する可能性あり
```

取得難易度:

```text
低〜中
```

特徴:

- 犬種別登録頭数の実数がある
- 前年比が掲載されている
- 希少犬種分類がある
- 英国犬種の分析に強い

Collector名:

```text
RoyalKennelClubCollector
```

Parser名:

```text
RoyalKennelClubRegistrationStatisticsParser
```

保存先:

```text
storage/raw/royal-kennel-club/{year}/
```

注意:

- The Kennel Club / The Royal Kennel Club の名称変更・表記揺れに注意
- Vulnerable Native BreedsはBreedStatusとして保存する
- 前年比は `previousYearDifference` として保存する

## AKC

正式名称: American Kennel Club  
コード: AKC  
国: US

主な対象:

- 犬種別登録統計
- 1885〜2008年の歴史的登録データ
- 近年の人気犬種ランキング

形式:

- PDF
- HTML

代表ページ:

```text
AKC Digital Collections
Dog Registration Statistics (1885–2008)
Most Popular Dog Breeds
```

想定取得期間:

```text
1885〜2008: 登録頭数統計
2009以降: ランキング中心
```

取得難易度:

```text
中〜高
```

特徴:

- 歴史データが非常に長い
- PDF解析が必要
- 近年は登録頭数実数ではなくランキング中心の可能性が高い

Collector名:

```text
AkcCollector
```

Parser名:

```text
AkcPdfRegistrationStatisticsParser
AkcPopularityRankingParser
```

保存先:

```text
storage/raw/akc/{year}/
```

注意:

- PDFの表構造が年代によって異なる可能性がある
- 登録数とランキングは別モデルに保存する
- 犬種名がFCIやJKCと異なる場合がある
- AKC独自認定犬種が存在する

## FCI

正式名称: Fédération Cynologique Internationale  
コード: FCI

主な対象:

- FCI犬種番号
- 犬種名
- 犬種グループ
- 原産国
- 犬種標準PDF

形式:

- HTML
- PDF

用途:

```text
犬種マスター
犬種ID正規化
```

取得難易度:

```text
中
```

Collector名:

```text
FciCollector
```

Parser名:

```text
FciBreedMasterParser
```

保存先:

```text
storage/raw/fci/
```

注意:

- FCIは登録頭数データの主ソースではない
- Breed masterの基準として使う
- AKCや英国KCと分類が異なる場合がある

## Collector追加時のチェックリスト

```text
団体名
国
公式URL
公開データの種類
データ形式
更新頻度
登録頭数の実数があるか
ランキングだけか
犬種名の言語
犬種分類
スクレイピング可否
robots.txt
利用規約
Parser難易度
```

## データ形式別方針

### HTML

- Cheerioで解析
- テーブル構造を確認
- 見出し名に依存しすぎない
- fixture HTMLを保存してテストする

### PDF

- pdf-parse等でテキスト抽出
- 表形式が崩れる場合は別ツールを検討
- 年代別にParserを分ける可能性あり
- fixture PDFを保存してテストする

### CSV

- ヘッダー定義を明示する
- 文字コードに注意する
- 区切り文字を確認する

### API

- レート制限に従う
- レスポンスJSONをSourceDocumentとして保存する
- バージョン変更に注意する

## 初期対応順

1. JKC HTML
2. The Royal Kennel Club HTML
3. AKC PDF
4. AKC Popularity Ranking
5. FCI Breed Master
6. CKC
7. Dogs Australia
