# World Dog Statistics Platform プロジェクトコンテキスト

Version: 0.2  
Owner: Mitsuharu Muramoto  
Language: Japanese / Code naming in English

## プロジェクト概要

World Dog Statistics Platform は、世界各国のケネルクラブが公開している犬種別登録頭数・人気ランキング・犬種分類・希少犬種情報などを収集し、統一された形式で検索・分析できるようにするデータプラットフォームです。

このプロジェクトは、犬籍登録そのものを管理するものではありません。各国団体が公開している統計情報を収集・正規化し、API・ダッシュボード・分析用データセットとして活用できる形に整備することを目的とします。

## プロジェクトの位置付け

当初は「犬種登録API」として検討していましたが、JKC・The Royal Kennel Club・AKCの公開データを調査した結果、単なるAPIではなく、世界中の犬種統計を横断的に扱うデータ基盤として設計する方が価値が高いと判断しました。

対象:

- REST API
- 将来的なGraphQL API
- データ収集基盤
- 出典管理
- 犬種名正規化
- 国別・団体別比較
- 年別推移分析
- ランキング分析
- 希少犬種・脆弱犬種の可視化
- 将来的なWebダッシュボード

## 背景

世界には複数の犬種管理団体があります。

代表例:

- JKC: Japan Kennel Club / 日本
- AKC: American Kennel Club / アメリカ
- The Royal Kennel Club / イギリス
- CKC: Canadian Kennel Club / カナダ
- ANKC / Dogs Australia / オーストラリア
- FCI: Fédération Cynologique Internationale / 国際畜犬連盟

ただし、世界中の犬種別登録頭数を統一的に取得できる公式APIは、現時点ではほぼ存在しません。FCIは犬種標準や国際的な犬種分類を管理する団体ですが、各国の犬籍登録数を一元的に提供しているわけではありません。

そのため、各団体が公開しているHTML・PDF・統計ページ・ランキングページを収集し、独自に正規化する必要があります。

## 初期データソース優先順位

### 優先度1: JKC

対象:

- 犬種別登録頭数
- 年別統計
- 1999年以降の公開データ

形式:

- HTML

評価:

- 取得しやすい
- 登録頭数の実数がある
- 日本市場分析の基準になる

### 優先度1: The Royal Kennel Club

対象:

- 犬種別登録頭数
- 年度別統計
- 前年比
- Vulnerable Native Breeds など希少犬種情報

形式:

- HTML

評価:

- 登録頭数の実数がある
- HTMLで取得しやすい
- 英国犬種や希少犬種の分析に強い
- 30年以上の登録データが存在する可能性が高い

### 優先度2: AKC

対象:

- 歴史的な犬種別登録統計
- 1885年〜2008年の公式アーカイブ統計
- 近年の人気犬種ランキング

形式:

- PDF
- Webページ
- ランキングページ
- プレスリリース

評価:

- 歴史データが非常に長い
- PDF解析が必要
- 2009年以降は登録頭数実数よりランキング中心になる可能性がある

### 優先度2: FCI

対象:

- 犬種マスター
- FCI犬種番号
- 犬種グループ
- 原産国
- 犬種標準

形式:

- HTML
- PDF

評価:

- 登録頭数ではなく犬種マスターとして重要
- 犬種ID正規化の基準として有用

## プロジェクトの目的

1. 世界共通の犬種マスターを整備する
2. 各国団体の犬種名を統一IDに紐づける
3. 年別・国別・団体別の犬種登録数を保存する
4. 人気犬種ランキングを保存する
5. 希少犬種・脆弱犬種の状態を保存する
6. 出典資料を追跡可能にする
7. 登録数の推移をAPIから取得できるようにする
8. 国別・団体別の比較分析を可能にする
9. 将来的にWebダッシュボードや分析サービスへ拡張する

## 対象外

初期段階では以下は対象外とします。

- 個体ごとの血統管理
- 血統書番号の管理
- ブリーダー個別情報の管理
- 個別犬の所有者情報
- 非公開データの取得
- ログインが必要な会員専用データの取得
- 利用規約に反するスクレイピング
- 高頻度アクセスによる対象サイトへの負荷

## 基本方針

FCIの犬種番号を犬種マスターの重要な基準IDとして利用します。ただし、AKCやThe Royal Kennel Clubなど、FCIとは分類や名称が異なる団体もあるため、各団体ごとの犬種名・別名・分類を `BreedAlias` として保持します。

例:

- Flat-Coated Retriever
- Flat Coated Retriever
- フラットコーテッド・レトリーバー
- フラットコーテッドレトリーバー

## データの種類

- Breed
- BreedAlias
- Country
- KennelClub
- BreedGroup
- FciGroup
- RegistrationStatistic
- PopularityRanking
- BreedStatus
- RareBreedStatus
- VulnerableBreedStatus
- SourceDocument
- ImportJob
- UnresolvedBreedAlias

## 想定ユースケース

### 犬種ごとの登録数推移

- 日本におけるフラットコーテッド・レトリーバーの登録頭数推移
- 英国におけるラブラドール・レトリーバーの登録頭数推移
- アメリカにおけるゴールデン・レトリーバーの歴史的推移

### 国別比較

- 同一犬種の日本・英国・米国比較
- 大型犬の登録比率の国別比較
- レトリーバー犬種の国別人気比較

### 希少犬種分析

- 英国のVulnerable Native Breeds
- 登録数が減少している犬種
- 国別の希少犬種傾向

## 技術スタック案

Backend:

- TypeScript
- NestJS

Database:

- PostgreSQL

ORM:

- Prisma

Collector / Scraping:

- Playwright
- Cheerio
- pdf-parse
- 必要に応じてPython補助スクリプト

Queue:

- BullMQ

Storage:

- ローカルファイル保存
- 将来的にS3互換ストレージ

API:

- REST API
- 将来的にGraphQL

Frontend / Dashboard:

- Next.js
- React
- Recharts

## 開発方針

1. FCI・JKC・The Royal Kennel Club・AKCを前提にしたデータモデルを作る
2. JKCのHTML統計を取り込む
3. The Royal Kennel ClubのHTML統計を取り込む
4. AKCのPDFアーカイブを取り込む
5. 犬種マスターと犬種別名マッピングを作る
6. 登録統計を検索できるREST APIを作る
7. 年別推移・ランキングAPIを追加する
8. 希少犬種ステータスを追加する
9. 簡易ダッシュボードを作る

## 長期ビジョン

World Dog Statistics Platform は、世界中のケネルクラブが公開する犬種統計を長期的に保存・正規化・比較可能にすることを目的としたオープンデータプラットフォームです。

将来的には以下を実現します。

- 世界犬種登録数ランキング
- 国別犬種人気比較
- 犬種別登録数の増減予測
- 希少犬種の可視化
- 大型犬・小型犬・使役犬などカテゴリ別分析
- ドッグショー結果との連携
- FCIグループ別の推移分析
- 犬種クラブ向け分析レポート
