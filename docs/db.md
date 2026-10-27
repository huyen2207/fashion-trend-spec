# DB設計書（データベース設計）

**プロジェクト名（仮）：** ファッショントレンド・コーディネート支援Webアプリ「StyleHer（スタイルハー）」
**作成日：** 2026年9月29日
**版数：** v0.2（設計レビューを反映）
**関連文書：** [プロジェクト仕様書・要件定義 v0.2](../プロジェクト仕様書_要件定義.md) / [設計書](../設計書.md) / [ER図](er.md)

---

## 1. 本書の目的と範囲

MVPの StyleHer は **データベースを持たない**。表示するデータは `data.js`（Next.js 版は `styleher-next/lib/data.ts`）に書き、お気に入り・閲覧履歴・診断結果はブラウザ（localStorage）に保存している（[設計書](../設計書.md) 6章・7章）。

本書は、このデータを **リレーショナルデータベース（RDB）に置き換えるときの設計** をまとめたものである。DBが必要になるのは次の場面である。

| 場面 | 対応する機能 |
|---|---|
| 運営者がブラウザからトレンド・コーデ・アイテムを登録・編集する | F-15 コンテンツ更新、F-22 管理画面 |
| お気に入り・最近見たもの・診断結果を複数の端末で同期する | F-21 会員登録・ログイン（F-13, F-16, F-19） |
| メールマガジンの登録者を保存して実際に配信する | F-20 メールマガジン登録 |
| お問い合わせの内容を保存して対応状況を管理する | お問い合わせフォーム（Next.js 版 `/contact`） |

- 静的サイト版と Next.js 版は **同じデータ構造** を使っているため、本書は両方に共通する。
- 画面・機能（F-01〜F-20）は変えずに動かせる構造にする。現在のデータ（ID・値）はそのまま移せる。
- 図は [ER図](er.md) にまとめる。

---

## 2. 前提と設計方針

### 2.1 前提

| 項目 | 内容 |
|---|---|
| DBMS | PostgreSQL 16 以上を想定する（Supabase などのマネージドサービスでも同じ定義で使える） |
| 文字コード | UTF-8 |
| 日時 | `timestamptz`（タイムゾーン付き）で保存し、画面で日本時間に変換して表示する |
| 認証 | 認証サービス（例：Supabase Auth）に任せ、**パスワードは本DBに持たない** |

### 2.2 設計方針

| 方針 | 理由 |
|---|---|
| 今のIDをそのまま主キーにする（`p01`、`o01`、`kireime` など） | ブラウザに保存されたお気に入り・閲覧履歴がIDで書かれているため、ログイン時にそのまま引き継げる。`data.js` からの移行も簡単 |
| 配列で持っていた項目は別のテーブルに分ける | 存在しないIDの参照を **外部キーでDBが防ぐ**。設計書 6.4 の整合性ルールを、人の確認ではなくDBで守れる |
| 並び順は `sort_order` 列で持つ | 「おすすめ順」「ポイントの順番」など、データの並びに意味があるため |
| コンテンツは削除せず **非公開** にする（`is_published`） | 「一度公開したIDは変えない・再利用しない」ルールを守るため。お気に入り・閲覧履歴から参照されている |
| 計算で求まる値は保存しない | コーデの合計金額・着回し数・今日の注目トレンド・購入リンクのURLは、元のデータから毎回計算する（値のずれを防ぐ。7章） |
| ルールはできるだけDBの制約で守る | IDの形式、値の範囲、状態と日時の組み合わせ、「おすすめのショップの購入リンクが必ずある」ことなどを、アプリの確認だけに頼らずDBでも止める |
| 運営者の変更は履歴に残す | だれが・いつ・何を変えたかを `audit_logs` に自動で記録する（4.8） |
| 個人情報は最小限にする | 保存する個人情報はメールアドレス、お問い合わせのお名前と内容のみ。お気に入り・診断結果はIDだけ |
| HTMLはDBに入れない | メインビジュアルの見出しの改行は `<br>` ではなく改行文字（`\n`）で持つ。表示時にエスケープできる |

### 2.3 命名規則

| 対象 | ルール | 例 |
|---|---|---|
| テーブル名 | 英小文字・スネークケース・複数形 | `products`, `recent_views` |
| 子テーブル・中間テーブル | 親テーブル名（単数形）＋ 子の名前（複数形） | `trend_products`, `outfit_ages` |
| 主キー | `id`。子テーブル・中間テーブルは複合主キー | `(trend_id, age_id)` |
| 外部キー | 参照先の単数形 ＋ `_id`。役割を表したいときは前に付ける | `category_id`、`recommended_shop_id` |
| 真偽値 | `is_` ＋ 状態 | `is_published` |
| 日時・日付 | 日時は `_at`、日付は `_on` | `created_at`, `published_on` |
| 文字列のID | ドメイン `code_id`（`varchar(30)`、英小文字・数字・`_` だけ。DBが形式を確認する） | `rakuten_fashion` |
| 選択肢の持ち方 | 画面に選択肢として出すもの（シーン・カラーなど）はマスタのテーブル、システム内部の状態（`status`・`role` など）は CHECK 制約で値を決める | `colors`、`status IN ('new', …)` |
| 制約・インデックス・トリガー | `ck_`（CHECK）、`uq_`（一意）、`fk_`（外部キー）、`idx_`（インデックス）、`trg_`（トリガー） ＋ テーブル名 ＋ 内容 | `ck_favorites_one_target` |

名前を付けていない外部キーは PostgreSQL の自動の名前（`テーブル名_列名_fkey`）を使う。

### 2.4 共通列

マスタ・コンテンツ・ユーザー・受付のテーブルは、次の列を持つ。

| 列名 | 型 | 必須 | 初期値 | 説明 |
|---|---|---|---|---|
| `is_published` | boolean | ○ | `true` | 公開フラグ（論理削除）。`false` にすると画面に出さない（マスタ・コンテンツのテーブルのみ） |
| `created_at` | timestamptz | ○ | `now()` | 作成日時 |
| `updated_at` | timestamptz | ○ | `now()` | 更新日時。更新時にトリガーで自動的に `now()` にする |

以降の表では、共通列は「共通列」とだけ書く。

次のテーブルは、理由があって共通列の一部を持たない。

| テーブル | 持つ列 | 理由 |
|---|---|---|
| 子テーブル・中間テーブル（`trend_points`、`outfit_ages` など） | なし | 親と一緒に「全部消して入れ直す」形で保存するため。変更日時は親の `updated_at`、変更内容は `audit_logs` でわかる |
| `favorites`、`audit_logs` | `created_at` のみ | 登録したあと変更しない行（変えるときは削除して登録し直す） |
| `recent_views` | `viewed_at` のみ | 「最後に見た日時」がそのまま更新日時になる |
| `users`、`favorites` など個人のデータ | `is_published` なし | 退会・削除のときは本当に削除する（個人情報を残さないため。10.2） |

**論理削除の考え方：** マスタ・コンテンツは `is_published = false` で非公開にし、行は削除しない（IDを再利用しないため、お気に入り・履歴から参照されているため）。個人のデータは論理削除にせず、本当に削除する。

---

## 3. テーブル一覧

8つのグループ、34テーブルで構成する。「初期件数」は現在の `data.js` を移したときの件数。

| # | グループ | テーブル名 | 論理名 | 概要 | 対応機能 | 初期件数 |
|---|---|---|---|---|---|---|
| 1 | マスタ | `scenes` | シーン | 通勤・休日などのシーン | F-05, F-16 | 6 |
| 2 | マスタ | `ages` | 年代 | 20代・30代・40代 | F-02, F-06, F-16 | 3 |
| 3 | マスタ | `tastes` | テイスト | きれいめ・カジュアルなど | F-06, F-16 | 5 |
| 4 | マスタ | `categories` | カテゴリー | トップス・アウターなど | F-08 | 7 |
| 5 | マスタ | `colors` | カラー | 白・黒・ベージュなど | F-08 | 11 |
| 6 | マスタ | `post_tags` | コラムのタグ | トレンド・通勤など | F-18 | 4 |
| 7 | マスタ | `inquiry_types` | お問い合わせの種類 | 掲載内容・不具合など | お問い合わせ | 5 |
| 8 | ショップ・アイテム | `shops` | ショップ | 人気ショップ・ECサイト | F-10, F-17 | 9 |
| 9 | ショップ・アイテム | `products` | アイテム | 商品の情報 | F-08, F-09 | 25 |
| 10 | ショップ・アイテム | `product_links` | 購入リンク | アイテムごとのECサイトへのリンク | F-10 | 50 |
| 11 | トレンド | `trends` | トレンド | トレンドの情報 | F-02〜F-04 | 6 |
| 12 | トレンド | `trend_images` | トレンドの追加画像 | 詳細で出すギャラリー画像 | F-03 | 18 |
| 13 | トレンド | `trend_points` | トレンドのポイント | 注目ポイント | F-03 | 18 |
| 14 | トレンド | `trend_tips` | トレンドのコツ | 着こなしと着回しのコツ | F-03 | 18 |
| 15 | トレンド | `trend_ages` | トレンドの対象年代 | トレンド × 年代 | F-02, F-16 | 15 |
| 16 | トレンド | `trend_tastes` | トレンドのテイスト | トレンド × テイスト | F-16 | 9 |
| 17 | トレンド | `trend_products` | トレンドの関連アイテム | トレンド × アイテム | F-03 | 24 |
| 18 | コーデ | `outfits` | コーデ | コーディネートの情報 | F-05〜F-07 | 25 |
| 19 | コーデ | `outfit_products` | コーデのアイテム | コーデ × アイテム（主役・サムネイル） | F-07, F-11 | 80 |
| 20 | コーデ | `outfit_tips` | コーデのコツ | 着こなしのコツ | F-07 | 30 |
| 21 | コーデ | `outfit_ages` | コーデの対象年代 | コーデ × 年代 | F-06, F-16 | 47 |
| 22 | コーデ | `outfit_tastes` | コーデのテイスト | コーデ × テイスト | F-06, F-16 | 38 |
| 23 | コラム・トップページ | `posts` | コラム | コラム記事 | F-18 | 4 |
| 24 | コラム・トップページ | `post_paragraphs` | コラムの段落 | 記事の本文 | F-18 | 12 |
| 25 | コラム・トップページ | `hero_slides` | メインビジュアル | トップのスライド | F-01 | 3 |
| 26 | コラム・トップページ | `community_images` | コミュニティ画像 | コミュニティ告知のギャラリー | （F-23 告知） | 8 |
| 27 | ユーザー | `users` | ユーザー | 会員 | F-21, F-22 | 0 |
| 28 | ユーザー | `favorites` | お気に入り | 保存したトレンド・コーデ・アイテム | F-13 | 0 |
| 29 | ユーザー | `recent_views` | 最近見たもの | 閲覧履歴（1人最大8件） | F-19 | 0 |
| 30 | ユーザー | `style_profiles` | 診断結果 | 年代・シーン | F-16 | 0 |
| 31 | ユーザー | `style_profile_tastes` | 診断結果のテイスト | 選んだテイスト（2つまで） | F-16 | 0 |
| 32 | 受付 | `newsletter_subscriptions` | メールマガジン登録 | 登録メールアドレス | F-20 | 0 |
| 33 | 受付 | `contact_inquiries` | お問い合わせ | お問い合わせの内容と対応状況 | お問い合わせ | 0 |
| 34 | 運用 | `audit_logs` | 変更履歴 | 運営者によるマスタ・コンテンツの変更の記録 | F-15, F-22 | 0 |

---

## 4. テーブル定義

表の見かた：「必須」の ○ は `NOT NULL`（値が必ず入る）、— は空（`NULL`）でもよい。キーの PK は主キー、FK は外部キー（→の先が参照先）、UK は一意（重複不可）。型の `code_id` は文字列ID用のドメイン（`varchar(30)`、英小文字・数字・`_` のみ。2.3）。

### 4.1 マスタ

#### `scenes`（シーン）

シーン別コーデ（F-05）の切り替えと、スタイル診断の Q3（F-16）の選択肢。

| 列名 | 論理名 | 型 | 必須 | 初期値 | キー | 説明 |
|---|---|---|---|---|---|---|
| `id` | シーンID | code_id | ○ | | PK | 例：`tsukin` |
| `name` | シーン名 | varchar(30) | ○ | | UK | 例：通勤 |
| `icon` | アイコン名 | varchar(20) | ○ | | | `briefcase` / `bag` / `heart` / `sparkle` / `plane` / `home` のいずれか |
| `sort_order` | 並び順 | smallint | ○ | `0` | | 小さい順に表示 |
| 共通列 | | | | | | `is_published` / `created_at` / `updated_at` |

#### `ages` / `tastes` / `categories` / `colors` / `post_tags` / `inquiry_types`（共通の形）

選択肢だけを持つマスタ。6つとも同じ列を持つ。

| 列名 | 論理名 | 型 | 必須 | 初期値 | キー | 説明 |
|---|---|---|---|---|---|---|
| `id` | ID | code_id | ○ | | PK | 下の表の「IDの例」 |
| `name` | 表示名 | varchar(30)（`inquiry_types` のみ varchar(50)） | ○ | | UK | 画面に出す名前 |
| `sort_order` | 並び順 | smallint | ○ | `0` | | 小さい順に表示 |
| 共通列 | | | | | | `is_published` / `created_at` / `updated_at`。使わなくなった選択肢は `is_published = false` にして隠す（使われている行は削除できないため） |

| テーブル | 論理名 | 使う場所 | IDの例 | 備考 |
|---|---|---|---|---|
| `ages` | 年代 | トレンド・コーデの絞り込み、診断 Q1 | `20s` | |
| `tastes` | テイスト | コーデの絞り込み、診断 Q2 | `kireime` | |
| `categories` | カテゴリー | アイテムの絞り込み | `tops` | 画面の「すべて（`all`）」は画面用の選択肢なのでDBに持たない |
| `colors` | カラー | アイテムの絞り込み | `white` | 現在は色名（白など）を直接持っている。「白／ホワイト」のような表記ゆれを防ぐためマスタにする |
| `post_tags` | コラムのタグ | コラムの分類 | `trend` | 現在はタグ名を直接持っている |
| `inquiry_types` | お問い合わせの種類 | お問い合わせフォーム | `bug` | Next.js 版の `TYPES` と同じ |

### 4.2 ショップ・アイテム

#### `shops`（ショップ）

ショップ一覧（F-17）に出すショップと、購入リンク（F-10）の行き先になるECサイトを **1つのテーブル** で持つ。楽天市場・Amazon のように「検索URLの型」を持つショップが、購入リンクの行き先になる。

| 列名 | 論理名 | 型 | 必須 | 初期値 | キー | 説明 |
|---|---|---|---|---|---|---|
| `id` | ショップID | code_id | ○ | | PK | 例：`rakuten`、`uniqlo`（現在のデータにはIDがないため新しく付ける） |
| `name` | ショップ名 | varchar(50) | ○ | | UK | 例：楽天市場 |
| `url` | 公式サイトURL | varchar(500) | ○ | | | ショップ一覧のリンク先 |
| `shop_type` | 種類 | varchar(30) | ○ | | | 例：プチプラ、総合通販 |
| `search_url_template` | 検索URLの型 | varchar(500) | — | | | 購入リンクを作るときの型。`{q}` を検索キーワードに置き換える。`{q}` を含まない値は登録できない。空のショップは購入リンクの行き先にしない |
| `sort_order` | 並び順 | integer | ○ | `0` | | ショップ一覧と購入リンクの並び |
| 共通列 | | | | | | `is_published` / `created_at` / `updated_at` |

#### `products`（アイテム）

| 列名 | 論理名 | 型 | 必須 | 初期値 | キー | 説明 |
|---|---|---|---|---|---|---|
| `id` | アイテムID | code_id | ○ | | PK | `p01` 形式 |
| `name` | アイテム名 | varchar(100) | ○ | | | |
| `category_id` | カテゴリー | code_id | ○ | | FK→`categories` | |
| `color_id` | カラー | code_id | ○ | | FK→`colors` | |
| `price` | 参考価格 | integer | ○ | | | 円・税込。0以上 |
| `recommended_shop_id` | おすすめのショップ | code_id | ○ | | FK→`shops`、FK→`product_links`（`id` と組み合わせて） | 購入リンクの先頭、「購入する」ボタンのリンク先になるショップ。このショップの購入リンクが `product_links` に必ずある |
| `image` | 画像 | varchar(255) | ○ | | | Unsplash の画像ID、または画像のパス（設計書 6.3） |
| `search_keyword` | 検索キーワード | varchar(100) | ○ | | | ECサイトの検索に使う語（現在の `q`） |
| `sort_order` | 並び順 | integer | ○ | `0` | | 「おすすめ順」の並び |
| 共通列 | | | | | | `is_published` / `created_at` / `updated_at` |

#### `product_links`（購入リンク）

1つのアイテムに、ECサイトごとの購入リンクを持つ（F-10 ショップ比較）。

| 列名 | 論理名 | 型 | 必須 | 初期値 | キー | 説明 |
|---|---|---|---|---|---|---|
| `product_id` | アイテムID | code_id | ○ | | PK, FK→`products` | |
| `shop_id` | ショップID | code_id | ○ | | PK, FK→`shops` | |
| `custom_url` | 個別のURL | varchar(1000) | — | | | 空のときは、`shops.search_url_template` の `{q}` を URL用に変換した `products.search_keyword` に置き換えたURLを使う（7.3）。アフィリエイトの商品ページなど、決まったURLにしたいときだけ入れる |
| `created_at` / `updated_at` | | | | | | 共通列 |

- 並び順は「`recommended_shop_id` のショップを先頭、残りは `shops.sort_order` 順」とする（7.3）。
- URLは保存しない（`custom_url` を除く）。保存すると、検索キーワードやショップの検索URLを変えたときに古いURLが残ってしまうため。
- `products.recommended_shop_id` のショップの行は **必ずある**。外部キー `fk_products_recommended_link`（`products (id, recommended_shop_id)` → `product_links (product_id, shop_id)`）で守る。アイテムと購入リンクを同時に登録できるよう、この外部キーは **コミット時に確認する**（`DEFERRABLE INITIALLY DEFERRED`）。おすすめのショップの行を消そうとするとエラーになる。
- `search_url_template` が空のショップを行き先にするときは、`custom_url` を必ず入れる（管理画面で保存時に確認する）。

### 4.3 トレンド

#### `trends`（トレンド）

| 列名 | 論理名 | 型 | 必須 | 初期値 | キー | 説明 |
|---|---|---|---|---|---|---|
| `id` | トレンドID | code_id | ○ | | PK | 例：`kireime`、`brown` |
| `name` | トレンド名 | varchar(50) | ○ | | | |
| `subtitle` | サブタイトル | varchar(100) | ○ | | | 現在の `sub` |
| `image` | メイン画像 | varchar(255) | ○ | | | |
| `hot_score` | 注目度 | smallint | ○ | | | 0〜100。現在の `hot` |
| `season` | 旬の時期 | varchar(30) | ○ | | | 例：2026秋冬、通年 |
| `post_count` | コーデ件数（表示用） | integer | ○ | `0` | | カードに出す件数。DBに登録したコーデの件数とは別の値（現在の `posts`） |
| `description` | 説明 | text | ○ | | | 現在の `desc` |
| `sort_order` | 並び順 | integer | ○ | `0` | | 一覧の並びと「今日の注目」の順番に使う（7.1） |
| 共通列 | | | | | | `is_published` / `created_at` / `updated_at` |

#### `trend_images`（トレンドの追加画像）

| 列名 | 論理名 | 型 | 必須 | 初期値 | キー | 説明 |
|---|---|---|---|---|---|---|
| `trend_id` | トレンドID | code_id | ○ | | PK, FK→`trends` | |
| `sort_order` | 表示順 | smallint | ○ | | PK | 1から |
| `image` | 画像 | varchar(255) | ○ | | | |

詳細画面では、メイン画像と先頭3枚の最大4枚を表示する。

#### `trend_points`（トレンドのポイント）/ `trend_tips`（トレンドのコツ）

2つとも同じ列を持つ。

| 列名 | 論理名 | 型 | 必須 | 初期値 | キー | 説明 |
|---|---|---|---|---|---|---|
| `trend_id` | トレンドID | code_id | ○ | | PK, FK→`trends` | |
| `sort_order` | 表示順 | smallint | ○ | | PK | 1から |
| `body` | 本文 | varchar(200) | ○ | | | 1項目の文章 |

#### `trend_ages`（トレンドの対象年代）/ `trend_tastes`（トレンドのテイスト）

| テーブル | 列名 | 論理名 | 型 | 必須 | キー |
|---|---|---|---|---|---|
| `trend_ages` | `trend_id` | トレンドID | code_id | ○ | PK, FK→`trends` |
| | `age_id` | 年代ID | code_id | ○ | PK, FK→`ages` |
| `trend_tastes` | `trend_id` | トレンドID | code_id | ○ | PK, FK→`trends` |
| | `taste_id` | テイストID | code_id | ○ | PK, FK→`tastes` |

#### `trend_products`（トレンドの関連アイテム）

| 列名 | 論理名 | 型 | 必須 | 初期値 | キー | 説明 |
|---|---|---|---|---|---|---|
| `trend_id` | トレンドID | code_id | ○ | | PK, FK→`trends` | |
| `product_id` | アイテムID | code_id | ○ | | PK, FK→`products` | |
| `sort_order` | 表示順 | smallint | ○ | `0` | | 「このトレンドのアイテム」の並び |

### 4.4 コーデ

#### `outfits`（コーデ）

| 列名 | 論理名 | 型 | 必須 | 初期値 | キー | 説明 |
|---|---|---|---|---|---|---|
| `id` | コーデID | code_id | ○ | | PK | `o01` 形式 |
| `scene_id` | シーン | code_id | ○ | | FK→`scenes` | |
| `title` | タイトル | varchar(100) | ○ | | | |
| `image` | コーデ画像 | varchar(255) | ○ | | | |
| `description` | 説明 | text | ○ | | | 現在の `desc` |
| `sort_order` | 並び順 | integer | ○ | `0` | | 一覧の並び。診断で同じ点数のときもこの順 |
| 共通列 | | | | | | `is_published` / `created_at` / `updated_at` |

#### `outfit_products`（コーデのアイテム）

現在の `main`（写真の主役アイテム）と `items`（サムネイルに出すアイテム）を、**1つのテーブル** にまとめる。

| 列名 | 論理名 | 型 | 必須 | 初期値 | キー | 説明 |
|---|---|---|---|---|---|---|
| `outfit_id` | コーデID | code_id | ○ | | PK, FK→`outfits` | |
| `product_id` | アイテムID | code_id | ○ | | PK, FK→`products` | |
| `role` | 役割 | varchar(10) | ○ | | | `main`＝写真の主役（サムネイルに出さない）、`item`＝サムネイルに出すアイテム |
| `sort_order` | 表示順 | smallint | ○ | `0` | | `item` の並び（1から）。`main` は 0 |

- `main` は **1つのコーデに1つまで**（部分一意インデックス `uq_outfit_products_main`）。`main` の表示順は 0、`item` は 1 から（CHECK 制約 `ck_outfit_products_sort_order`）。`item` は3件を推奨。
- 着回し数（F-11）とコーデの合計金額（F-07）は、`role` に関係なくすべての行を数える（設計書 4.4・4.5 と同じ）。
- 同じアイテムを1つのコーデに2回入れることはできない（主キー）。

#### `outfit_tips`（コーデのコツ）

| 列名 | 論理名 | 型 | 必須 | 初期値 | キー | 説明 |
|---|---|---|---|---|---|---|
| `outfit_id` | コーデID | code_id | ○ | | PK, FK→`outfits` | |
| `sort_order` | 表示順 | smallint | ○ | | PK | 1から |
| `body` | 本文 | varchar(200) | ○ | | | |

#### `outfit_ages`（コーデの対象年代）/ `outfit_tastes`（コーデのテイスト）

| テーブル | 列名 | 論理名 | 型 | 必須 | キー |
|---|---|---|---|---|---|
| `outfit_ages` | `outfit_id` | コーデID | code_id | ○ | PK, FK→`outfits` |
| | `age_id` | 年代ID | code_id | ○ | PK, FK→`ages` |
| `outfit_tastes` | `outfit_id` | コーデID | code_id | ○ | PK, FK→`outfits` |
| | `taste_id` | テイストID | code_id | ○ | PK, FK→`tastes` |

### 4.5 コラム・トップページ

#### `posts`（コラム）

| 列名 | 論理名 | 型 | 必須 | 初期値 | キー | 説明 |
|---|---|---|---|---|---|---|
| `id` | コラムID | code_id | ○ | | PK | `a01` 形式 |
| `title` | タイトル | varchar(100) | ○ | | | |
| `tag_id` | タグ | code_id | ○ | | FK→`post_tags` | |
| `published_on` | 公開日 | date | ○ | | | 現在の `date`。新しい順に表示する |
| `image` | 画像 | varchar(255) | ○ | | | |
| `excerpt` | 概要 | varchar(200) | ○ | | | |
| 共通列 | | | | | | `is_published` / `created_at` / `updated_at` |

#### `post_paragraphs`（コラムの段落）

| 列名 | 論理名 | 型 | 必須 | 初期値 | キー | 説明 |
|---|---|---|---|---|---|---|
| `post_id` | コラムID | code_id | ○ | | PK, FK→`posts` | |
| `sort_order` | 段落の順番 | smallint | ○ | | PK | 1から |
| `body` | 本文 | text | ○ | | | 1段落の文章 |

#### `hero_slides`（メインビジュアル）

| 列名 | 論理名 | 型 | 必須 | 初期値 | キー | 説明 |
|---|---|---|---|---|---|---|
| `id` | スライドID | integer | ○ | 自動採番 | PK | |
| `image` | 画像 | varchar(255) | ○ | | | |
| `image_position` | 画像の表示位置 | varchar(30) | ○ | `'center 30%'` | | CSS の `object-position` に使う値（現在の `pos`） |
| `title` | 見出し | varchar(100) | ○ | | | 改行は `\n` で持つ。静的サイト版の `<br>` は `\n` に置き換えて登録する |
| `body` | 本文 | varchar(200) | ○ | | | 現在の `text` |
| `sort_order` | 並び順 | integer | ○ | `0` | | |
| 共通列 | | | | | | `is_published` / `created_at` / `updated_at` |

#### `community_images`（コミュニティ画像）

| 列名 | 論理名 | 型 | 必須 | 初期値 | キー | 説明 |
|---|---|---|---|---|---|---|
| `id` | 画像ID | integer | ○ | 自動採番 | PK | |
| `image` | 画像 | varchar(255) | ○ | | | |
| `sort_order` | 並び順 | integer | ○ | `0` | | |
| 共通列 | | | | | | `is_published` / `created_at` / `updated_at` |

### 4.6 ユーザー（F-21 会員登録の実現時に使う）

ログインしていない人は、今までどおりブラウザ（localStorage）に保存する。ログインした人だけ、次のテーブルに保存する。

#### `users`（ユーザー）

| 列名 | 論理名 | 型 | 必須 | 初期値 | キー | 説明 |
|---|---|---|---|---|---|---|
| `id` | ユーザーID | uuid | ○ | `gen_random_uuid()` | PK | next-auth のセッション（JWT の `sub`）に入れる |
| `email` | メールアドレス | varchar(254) | ○ | | UK | 大文字・小文字を区別せずに重複を防ぐ（`lower(email)` の一意インデックス） |
| `role` | 権限 | varchar(10) | ○ | `'member'` | | `member`＝一般会員、`admin`＝管理者（F-22 管理画面を使える） |
| `password_hash` | パスワードのハッシュ | varchar(100) | — | | | bcrypt のハッシュ。空のときはログインできない |
| `last_login_at` | 最終ログイン日時 | timestamptz | — | | | |
| `created_at` / `updated_at` | | | | | | 共通列 |

パスワードそのものは持たず、bcrypt のハッシュだけを持つ（next-auth でメールアドレスとパスワードでログインする。[API設計書](api.md) 3.4）。

#### `favorites`（お気に入り）

| 列名 | 論理名 | 型 | 必須 | 初期値 | キー | 説明 |
|---|---|---|---|---|---|---|
| `id` | お気に入りID | bigint | ○ | 自動採番 | PK | |
| `user_id` | ユーザーID | uuid | ○ | | FK→`users` | |
| `trend_id` | トレンドID | code_id | — | | FK→`trends` | トレンドをお気に入りしたとき |
| `outfit_id` | コーデID | code_id | — | | FK→`outfits` | コーデをお気に入りしたとき |
| `product_id` | アイテムID | code_id | — | | FK→`products` | アイテムをお気に入りしたとき |
| `created_at` | 登録日時 | timestamptz | ○ | `now()` | | お気に入り一覧の並びに使う |

- `trend_id` / `outfit_id` / `product_id` のうち、**ちょうど1つだけ** に値を入れる（CHECK 制約）。
- 同じ人が同じものを二重に登録できない（`(user_id, trend_id)` などの一意制約）。
- **この形にした理由：** localStorage のように「種類」と「ID」を1つの列（例：`product:p07`）で持つと外部キーを付けられず、存在しないIDが保存されてしまう。種類ごとに列を分けると、3種類とも外部キーで守れる。

#### `recent_views`（最近見たもの）

| 列名 | 論理名 | 型 | 必須 | 初期値 | キー | 説明 |
|---|---|---|---|---|---|---|
| `id` | 履歴ID | bigint | ○ | 自動採番 | PK | |
| `user_id` | ユーザーID | uuid | ○ | | FK→`users` | |
| `trend_id` | トレンドID | code_id | — | | FK→`trends` | |
| `outfit_id` | コーデID | code_id | — | | FK→`outfits` | |
| `product_id` | アイテムID | code_id | — | | FK→`products` | |
| `viewed_at` | 最後に見た日時 | timestamptz | ○ | `now()` | | 新しい順に表示する |

- `favorites` と同じく、3つのうち **ちょうど1つだけ** に値を入れる。同じものは1行だけ（見直したら `viewed_at` を更新して先頭に移す）。
- 1人 **最大8件**。記録するたびに9件目以降の古いものを消す（7.5）。コラムは記録しない。

#### `style_profiles`（診断結果）

| 列名 | 論理名 | 型 | 必須 | 初期値 | キー | 説明 |
|---|---|---|---|---|---|---|
| `user_id` | ユーザーID | uuid | ○ | | PK, FK→`users` | 1人1件 |
| `age_id` | 年代 | code_id | ○ | | FK→`ages` | 診断 Q1 の答え |
| `scene_id` | よく着るシーン | code_id | ○ | | FK→`scenes` | 診断 Q3 の答え |
| `created_at` / `updated_at` | | | | | | 共通列 |

#### `style_profile_tastes`（診断結果のテイスト）

| 列名 | 論理名 | 型 | 必須 | 初期値 | キー | 説明 |
|---|---|---|---|---|---|---|
| `user_id` | ユーザーID | uuid | ○ | | PK, FK→`style_profiles` | |
| `priority` | 優先順位 | smallint | ○ | | PK | `1`＝1つ目に選んだテイスト（重視）、`2`＝2つ目。1か2のみ |
| `taste_id` | テイスト | code_id | ○ | | FK→`tastes`、UK（`user_id` と組み合わせて） | 診断 Q2 の答え。同じテイストを2回は選べない |

- テイストは **2つまで**（`priority` が 1 か 2 のみ）で、1つ目を重視して点数を付ける（設計書 4.9）。この順番を `priority` で持つ。
- `priority = 1` の行が必ず1件あること（3問すべてに答えること）は、アプリで保存前に確認する。

### 4.7 受付

#### `newsletter_subscriptions`（メールマガジン登録）

MVP（F-20）では形式チェックだけで保存しない。実際に配信を始めるときに使う。登録確認メールのリンクを押してはじめて配信する方式（ダブルオプトイン）を前提とする。

| 列名 | 論理名 | 型 | 必須 | 初期値 | キー | 説明 |
|---|---|---|---|---|---|---|
| `id` | 登録ID | bigint | ○ | 自動採番 | PK | |
| `email` | メールアドレス | varchar(254) | ○ | | UK | 大文字・小文字を区別せずに重複を防ぐ。`文字@文字.文字` の形のみ（F-20 の入力チェックと同じ） |
| `status` | 状態 | varchar(20) | ○ | `'pending'` | | `pending`＝確認待ち、`active`＝配信中、`unsubscribed`＝配信停止 |
| `confirmed_at` | 確認日時 | timestamptz | — | | | 確認メールのリンクを押した日時 |
| `unsubscribed_at` | 配信停止日時 | timestamptz | — | | | |
| `created_at` / `updated_at` | | | | | | 共通列 |

- 状態と日時の組み合わせが矛盾しないよう、CHECK 制約 `ck_newsletter_subscriptions_dates` で守る（`pending` は日時なし、`active` は確認日時あり、`unsubscribed` は配信停止日時あり）。
- 会員（`users`）とは別に持つ。会員登録していない人もメールマガジンに登録できるため。

#### `contact_inquiries`（お問い合わせ）

Next.js 版のお問い合わせフォームは、現在はフォーム受付サービス（Formspree など）に送信している（未設定のときはデモ）。DBに保存して対応状況を管理するときに使う。

| 列名 | 論理名 | 型 | 必須 | 初期値 | キー | 説明 |
|---|---|---|---|---|---|---|
| `id` | お問い合わせID | bigint | ○ | 自動採番 | PK | |
| `user_id` | ユーザーID | uuid | — | | FK→`users` | ログイン中に送ったときのみ。退会すると空になる |
| `name` | お名前 | varchar(50) | ○ | | | フォームの入力チェック（50文字以内）と同じ |
| `email` | メールアドレス | varchar(254) | ○ | | | 返信先。`文字@文字.文字` の形のみ |
| `inquiry_type_id` | お問い合わせの種類 | code_id | ○ | | FK→`inquiry_types` | |
| `message` | お問い合わせ内容 | text | ○ | | | 10〜1000文字。前後の空白を除いてから保存する |
| `status` | 対応状況 | varchar(20) | ○ | `'new'` | | `new`＝未対応、`in_progress`＝対応中、`closed`＝対応済み |
| `created_at` / `updated_at` | | | | | | 共通列。`created_at` が受付日時 |

`name`・`email` は、ログイン中でも `users` から引かずに送られた値をそのまま持つ。送った時点の返信先を残すためで、重複ではない。

### 4.8 運用

#### `audit_logs`（変更履歴）

管理画面（F-22）などで運営者がマスタ・コンテンツを変えたとき、**トリガーで自動的に** 1行ずつ記録する。「いつ・だれが・何を・どう変えたか」を後から確認でき、まちがえて変えた内容を元に戻すときにも使う。

| 列名 | 論理名 | 型 | 必須 | 初期値 | キー | 説明 |
|---|---|---|---|---|---|---|
| `id` | 履歴ID | bigint | ○ | 自動採番 | PK | |
| `user_id` | 変更した人 | uuid | — | | FK→`users` | アプリが接続ごとに `app.user_id` に入れたユーザーID。SQLで直接変えたときなどは空。変更した人が退会しても履歴は残す（空にする） |
| `table_name` | テーブル名 | varchar(63) | ○ | | | 例：`products` |
| `action` | 操作 | varchar(10) | ○ | | | `insert` / `update` / `delete` |
| `old_data` | 変更前の値 | jsonb | — | | | 行全体。`insert` のときは空 |
| `new_data` | 変更後の値 | jsonb | — | | | 行全体。`delete` のときは空 |
| `created_at` | 記録日時 | timestamptz | ○ | `now()` | | |

- 対象は、運営者が管理するマスタ・コンテンツの26テーブル（子テーブル・中間テーブルを含む）。
- お気に入り・最近見たもの・診断結果・お問い合わせ・メールマガジン・ユーザーは **記録しない**。件数が多いことと、個人情報を履歴に写さないため。
- アプリは、変更する前に同じトランザクションの中で `SELECT set_config('app.user_id', '<ユーザーID>', true)` を実行して、変更した人を渡す。

---

## 5. リレーション（外部キー）と削除時の動き

テーブル同士のつながりは [ER図](er.md) を参照。参照先の行を削除したときの動きは、次のルールで決める。

| 削除時の動き | 対象の外部キー | 理由 |
|---|---|---|
| **CASCADE**（一緒に消す） | `product_links.product_id`、`trend_images` / `trend_points` / `trend_tips` / `trend_ages` / `trend_tastes` / `trend_products` の `trend_id`、`outfit_products` / `outfit_tips` / `outfit_ages` / `outfit_tastes` の `outfit_id`、`post_paragraphs.post_id` | 親の一部なので、親と一緒に消す |
| **CASCADE**（一緒に消す） | `favorites` / `recent_views` / `style_profiles` の `user_id`、`style_profile_tastes.user_id` | 退会したら本人のデータを残さない |
| **CASCADE**（一緒に消す） | `favorites` / `recent_views` の `trend_id` / `outfit_id` / `product_id` | コンテンツは通常は削除しない（非公開にする）が、削除した場合はお気に入り・履歴からも消す |
| **SET NULL**（空にする） | `contact_inquiries.user_id`、`audit_logs.user_id` | 対応・変更の記録は残し、退会した本人とのつながりだけ外す |
| **RESTRICT**（消せない） | 上記以外すべて。マスタへの参照（`category_id`、`color_id`、`scene_id`、`age_id`、`taste_id`、`tag_id`、`inquiry_type_id`）、`products.recommended_shop_id`、`product_links.shop_id`、`trend_products.product_id`、`outfit_products.product_id` | 使われているものを消すと画面が壊れるため、DBが削除を止める |
| **NO ACTION・コミット時に確認** | `fk_products_recommended_link`（`products (id, recommended_shop_id)` → `product_links`） | アイテムと購入リンクを同じトランザクションで登録できるようにする。おすすめのショップの購入リンクだけを消すことはできない（アイテムごと消すときは一緒に消える） |

---

## 6. インデックス

主キーと一意制約には PostgreSQL が自動でインデックスを作る。それ以外に、次のインデックスを作る。

- **検索の条件と並び順に合わせる：** 画面のクエリの WHERE・JOIN・ORDER BY に使う列に作る。絞り込みと並び替えを一緒に行うクエリは、複合インデックス（例：`scene_id` で絞って `sort_order` で並べる → `(scene_id, sort_order)`）にする。
- **外部キーの列にも作る：** PostgreSQL は外部キーの列に自動でインデックスを作らない。参照先を削除・更新するときの確認が遅くならないよう、複合主キーの先頭にない外部キーの列には作る。
- MVPのデータ量（数十〜数百件）では、どのクエリもインデックスがなくても十分速い。件数が増えたときに備えたもの。

| テーブル | インデックス名 | 列 | 目的 |
|---|---|---|---|
| `products` | `idx_products_sort_order` | `sort_order` | アイテム一覧の「おすすめ順」（F-08） |
| `products` | `idx_products_category_id_price` | `category_id, price` | カテゴリーで絞り込んで価格順に並べる。`category_id` の外部キーの確認にも使う |
| `products` | `idx_products_color_id` | `color_id` | カラーで絞り込む |
| `products` | `idx_products_price` | `price` | 価格帯で絞り込む・価格順に並べる |
| `products` | `idx_products_recommended_shop_id` | `recommended_shop_id` | ショップ削除時の確認 |
| `product_links` | `idx_product_links_shop_id` | `shop_id` | ショップ削除時の確認 |
| `trends` | `idx_trends_sort_order` | `sort_order` | トレンド一覧・今日の注目の順番（F-02, F-04） |
| `trend_ages` / `trend_tastes` | `idx_trend_ages_age_id` / `idx_trend_tastes_taste_id` | `age_id` / `taste_id` | 年代・テイストからトレンドを探す（診断） |
| `trend_products` | `idx_trend_products_product_id` | `product_id` | 「このアイテムが入っているトレンド」（F-09） |
| `outfits` | `idx_outfits_scene_id_sort_order` | `scene_id, sort_order` | シーンで絞り込んで並び順に出す（F-05、7.4） |
| `outfit_products` | `idx_outfit_products_product_id` | `product_id` | 着回し数・「このアイテムを使ったコーデ」（F-11） |
| `outfit_products` | `uq_outfit_products_main`（一意・部分） | `outfit_id`（`role = 'main'` の行のみ） | 主役アイテムを1コーデ1つまでにする |
| `outfit_ages` / `outfit_tastes` | `idx_outfit_ages_age_id` / `idx_outfit_tastes_taste_id` | `age_id` / `taste_id` | コーデの絞り込み（F-06） |
| `posts` | `idx_posts_tag_id` | `tag_id` | タグで探す |
| `posts` | `idx_posts_published_on` | `published_on DESC` | 新着順に並べる |
| `users` | `uq_users_email`（一意） | `lower(email)` | 大文字・小文字を区別せずに重複を防ぐ |
| `favorites` | `idx_favorites_user_id_created_at` | `user_id, created_at` | 自分のお気に入り一覧 |
| `favorites` | `idx_favorites_trend_id` ほか2つ | `trend_id` / `outfit_id` / `product_id` | コンテンツ削除時の確認 |
| `recent_views` | `idx_recent_views_user_id_viewed_at` | `user_id, viewed_at DESC` | 自分の履歴を新しい順に出す |
| `recent_views` | `idx_recent_views_trend_id` ほか2つ | `trend_id` / `outfit_id` / `product_id` | コンテンツ削除時の確認 |
| `style_profiles` | `idx_style_profiles_age_id` / `idx_style_profiles_scene_id` | `age_id` / `scene_id` | マスタ削除時の確認 |
| `style_profile_tastes` | `idx_style_profile_tastes_taste_id` | `taste_id` | マスタ削除時の確認 |
| `newsletter_subscriptions` | `uq_newsletter_subscriptions_email`（一意） | `lower(email)` | 同じアドレスの二重登録を防ぐ |
| `contact_inquiries` | `idx_contact_inquiries_status_created_at` | `status, created_at DESC` | 未対応のお問い合わせを新しい順に出す |
| `contact_inquiries` | `idx_contact_inquiries_user_id` / `idx_contact_inquiries_inquiry_type_id` | `user_id` / `inquiry_type_id` | 退会時・種類削除時の確認 |
| `audit_logs` | `idx_audit_logs_table_name_created_at` | `table_name, created_at DESC` | テーブルごとの変更履歴を新しい順に出す |
| `audit_logs` | `idx_audit_logs_user_id` | `user_id` | 人ごとの変更履歴・退会時の確認 |

---

## 7. 計算で求める値（テーブルに持たない値）

次の値は保存せず、表示のたびに計算する。保存すると、アイテムの価格やコーデの中身を変えたときに値がずれるため。

| 値 | 求め方 | 計算する場所 |
|---|---|---|
| 今日の注目トレンド（F-04） | 公開中のトレンドを `sort_order` 順に並べ、「1970年1月1日からの日数 ÷ 件数」の余りの番目 | 画面（閲覧者の日付で切り替えるため、現在と同じ） |
| コーデの合計金額（F-07） | `outfit_products` のアイテムの `price` の合計 | SQL（7.2） |
| 着回し数（F-11） | `outfit_products` をアイテムごとに数える | SQL（7.2） |
| 購入リンクのURL（F-10） | `custom_url`、なければショップの検索URLの型 ＋ 検索キーワード | SQL で材料を取り出し、アプリでURLにする（7.3） |
| 「購入する」ボタンのリンク（F-10） | 購入リンクのうち、おすすめのショップのもの（7.3 の先頭） | 同上 |
| お気に入りの件数（F-13） | `favorites` の行数 | SQL |
| 診断のおすすめ（F-16） | 点数方式（設計書 4.9） | SQL（7.6）またはアプリ |

以下のSQLは、付録AのDDLに現在の `lib/data.ts` の全データを入れて実行し、**画面の計算結果（`outfitPrice`・`wearCount`・購入リンクのURLと並び・コーデの絞り込み・診断のおすすめ）と全件一致すること** を確認している。

### 7.1 今日の注目トレンド

画面で計算する。DBからは、公開中のトレンドを並び順で取り出すだけでよい。

```sql
SELECT id, name FROM trends WHERE is_published ORDER BY sort_order;
```

トレンドを追加・非公開にすると件数が変わり、翌日以降の順番もずれる（毎日違うトレンドが出る点は変わらない）。

### 7.2 コーデの合計金額・着回し数

```sql
-- コーデの合計金額（main と item の両方を含む）
SELECT o.id, SUM(p.price) AS total_price
FROM outfits o
JOIN outfit_products op ON op.outfit_id = o.id
JOIN products p ON p.id = op.product_id
WHERE o.is_published
GROUP BY o.id;

-- 着回し数（そのアイテムを使った公開中のコーデの件数）
SELECT p.id, COUNT(o.id) AS wear_count
FROM products p
LEFT JOIN outfit_products op ON op.product_id = p.id
LEFT JOIN outfits o ON o.id = op.outfit_id AND o.is_published
GROUP BY p.id;
```

### 7.3 購入リンク（おすすめのショップを先頭に）

```sql
SELECT pl.shop_id, pl.custom_url, s.search_url_template, p.search_keyword
FROM product_links pl
JOIN products p ON p.id = pl.product_id
JOIN shops s ON s.id = pl.shop_id
WHERE pl.product_id = 'p07'
ORDER BY (pl.shop_id = p.recommended_shop_id) DESC, s.sort_order;
```

アプリで、行ごとに次のようにURLを作る。先頭の行のURLが「購入する」ボタンのリンクになる。

```js
const url = row.custom_url ?? row.search_url_template.replace("{q}", encodeURIComponent(row.search_keyword));
```

### 7.4 コーデの絞り込み（シーン × 年代 × テイスト）

```sql
-- $1 = シーンID、$2 = 年代ID または 'all'、$3 = テイストID または 'all'
SELECT o.id
FROM outfits o
WHERE o.is_published
  AND o.scene_id = $1
  AND ($2 = 'all' OR EXISTS (SELECT 1 FROM outfit_ages oa WHERE oa.outfit_id = o.id AND oa.age_id = $2))
  AND ($3 = 'all' OR EXISTS (SELECT 1 FROM outfit_tastes ot WHERE ot.outfit_id = o.id AND ot.taste_id = $3))
ORDER BY o.sort_order;
```

### 7.5 最近見たものを記録する（最大8件）

同じトランザクションで、記録と古いものの削除を続けて行う。

```sql
-- 記録する（すでにあれば日時だけ更新して先頭へ）。アイテムの例
INSERT INTO recent_views (user_id, product_id) VALUES ($1, $2)
ON CONFLICT (user_id, product_id) DO UPDATE SET viewed_at = now();

-- 新しい8件だけを残す
DELETE FROM recent_views
WHERE user_id = $1
  AND id NOT IN (
    SELECT id FROM recent_views
    WHERE user_id = $1
    ORDER BY viewed_at DESC
    LIMIT 8
  );
```

### 7.6 診断のおすすめコーデ

シーンが合う +4点、年代が合う +2点、1つ目のテイストが合う +2点、2つ目のテイストが合う +1点。0点は出さず、同じ点数なら `sort_order` 順で上位4件。

```sql
SELECT id FROM (
  SELECT o.id, o.sort_order,
         (CASE WHEN o.scene_id = sp.scene_id THEN 4 ELSE 0 END)
       + (CASE WHEN EXISTS (SELECT 1 FROM outfit_ages oa WHERE oa.outfit_id = o.id AND oa.age_id = sp.age_id) THEN 2 ELSE 0 END)
       + (SELECT COALESCE(SUM(CASE spt.priority WHEN 1 THEN 2 ELSE 1 END), 0)
          FROM style_profile_tastes spt
          JOIN outfit_tastes ot ON ot.taste_id = spt.taste_id AND ot.outfit_id = o.id
          WHERE spt.user_id = sp.user_id) AS score
  FROM outfits o
  CROSS JOIN style_profiles sp
  WHERE sp.user_id = $1 AND o.is_published
) s
WHERE score > 0
ORDER BY score DESC, sort_order
LIMIT 4;
```

おすすめトレンドも同じ形で求める（年代 +2点、1つ目のテイスト +4点、2つ目 +2点、上位2件）。

---

## 8. 現在のデータとの対応（移行）

### 8.1 `data.js` / `lib/data.ts` → テーブル

| 現在のデータ | テーブル・列 | 移すときの変換 |
|---|---|---|
| `scenes` / `ages` / `tastes` | `scenes` / `ages` / `tastes` | 配列の順番を `sort_order` にする |
| `categories` | `categories` | `all`（すべて）は登録しない |
| `products[].id` / `name` / `price` / `img` | `products.id` / `name` / `price` / `image` | そのまま |
| `products[].cat` | `products.category_id` | そのまま |
| `products[].color` | `products.color_id` | 色名を `colors` のIDに置き換える（白 → `white`） |
| `products[].shop` | `products.recommended_shop_id` | ショップ名をIDに置き換える（楽天市場 → `rakuten`、Amazon → `amazon`） |
| `products[].q` | `products.search_keyword` | そのまま |
| `products[].links` | `product_links` | 1アイテムにつき、楽天市場・Amazon の2行。URLは型から作れるので `custom_url` は空にする。`products` と同じトランザクションで登録する |
| `products[].url` | （持たない） | 7.3 で求める |
| 配列の順番 | `products.sort_order` | 「おすすめ順」になる |
| `trends[].sub` / `hot` / `posts` / `desc` | `trends.subtitle` / `hot_score` / `post_count` / `description` | 列名を変えるだけ |
| `trends[].gallery` / `points` / `tips` | `trend_images` / `trend_points` / `trend_tips` | 配列の1要素を1行に。順番を `sort_order`（1から）にする |
| `trends[].ages` / `tastes` / `products` | `trend_ages` / `trend_tastes` / `trend_products` | 配列の1要素を1行に |
| `outfits[].scene` / `desc` | `outfits.scene_id` / `description` | 列名を変えるだけ |
| `outfits[].main` | `outfit_products`（`role = 'main'`、`sort_order = 0`） | ある場合のみ |
| `outfits[].items` | `outfit_products`（`role = 'item'`） | 順番を `sort_order`（1から）にする |
| `outfits[].tips` / `ages` / `tastes` | `outfit_tips` / `outfit_ages` / `outfit_tastes` | 配列の1要素を1行に |
| `shops[]` | `shops` | IDを新しく付ける。楽天市場・Amazon には `search_url_template` を入れる（付録B） |
| `posts[].tag` / `date` / `body` | `posts.tag_id` / `published_on`、`post_paragraphs` | タグ名をIDに置き換える。本文は1段落を1行に |
| `heroSlides[].pos` / `title` / `text` | `hero_slides.image_position` / `title` / `body` | `pos` がないときは `center 30%`。見出しの `<br>` は `\n` に |
| `community[]` | `community_images.image` | 配列の順番を `sort_order` にする |

### 8.2 ブラウザ保存（localStorage）→ テーブル（ログイン時の引き継ぎ）

会員登録（F-21）後、初めてログインしたときに、その端末に保存されている内容をDBに移す（設計書 12章の方針）。

| localStorage のキー | 形式 | 移す先 | 移し方 |
|---|---|---|---|
| `styleher:favorites` | `{ trend: ID[], outfit: ID[], product: ID[] }` | `favorites` | IDを1件ずつ対応する列に入れる。すでにDBにあるものは飛ばす（`ON CONFLICT DO NOTHING`）。データにないIDは捨てる |
| `styleher:recent` | `"種類:ID"` の配列（新しい順） | `recent_views` | `:` の前で種類を見分けて対応する列に入れる。並び順が保たれるよう `viewed_at` をずらして入れ、最後に8件に削る |
| `styleher:profile` | `{ age, tastes: ID[], scene }` | `style_profiles`、`style_profile_tastes` | DBにまだ診断結果がないときだけ登録する（DBの結果を優先する）。`tastes` の順番を `priority` にする |

移したあとも localStorage は消さない（ログアウトしたときに使えるようにする）。

---

## 9. 機能とテーブルの対応（CRUD）

C＝登録、R＝参照、U＝更新、D＝削除。コンテンツの登録・更新（C/U）は管理画面（F-22）から行う。

| 機能 | 参照（R） | 登録・更新・削除（C/U/D） |
|---|---|---|
| F-01 トップページ | `hero_slides`, `trends`, `outfits`, `products`, `shops`, `posts`, `community_images` | — |
| F-02 トレンド一覧 | `trends`, `trend_ages`, `ages` | — |
| F-03 トレンド詳細 | `trends`, `trend_images`, `trend_points`, `trend_tips`, `trend_ages`, `trend_products`, `products`, `outfits` | `recent_views`（C/U/D） |
| F-04 今日の注目トレンド | `trends` | — |
| F-05・F-06 シーン別コーデ・絞り込み | `outfits`, `outfit_ages`, `outfit_tastes`, `outfit_products`, `scenes`, `ages`, `tastes` | — |
| F-07 コーデ詳細 | `outfits`, `outfit_products`, `outfit_tips`, `products`, `product_links` | `recent_views`（C/U/D） |
| F-08 アイテム一覧 | `products`, `categories`, `colors`, `outfit_products` | — |
| F-09・F-10 アイテム詳細・ショップ比較 | `products`, `product_links`, `shops`, `trend_products`, `outfit_products` | `recent_views`（C/U/D） |
| F-11 着回し提案 | `outfit_products`, `outfits` | — |
| F-12 キーワード検索 | `trends`, `trend_points`, `outfits`, `scenes`, `outfit_tastes`, `tastes`, `products`, `colors`, `categories`, `posts`, `post_tags`, `post_paragraphs`, `shops` | — |
| F-13 お気に入り | `favorites` | `favorites`（C/D） |
| F-15 コンテンツ更新（F-22 管理画面） | すべてのコンテンツ・マスタ、`audit_logs` | マスタ・コンテンツのテーブル（C/U）。削除の代わりに `is_published = false`。`audit_logs`（C：トリガーで自動） |
| F-16 かんたんスタイル診断 | `style_profiles`, `style_profile_tastes`, `trends`, `trend_ages`, `trend_tastes`, `outfits`, `outfit_ages`, `outfit_tastes` | `style_profiles`, `style_profile_tastes`（C/U/D） |
| F-17 ショップ一覧 | `shops` | — |
| F-18 コラム | `posts`, `post_paragraphs`, `post_tags` | — |
| F-19 最近見たもの | `recent_views` | `recent_views`（D：履歴を消す） |
| F-20 メールマガジン登録 | — | `newsletter_subscriptions`（C/U） |
| F-21 会員登録・ログイン | `users` | `users`（C/U/D）、ログイン時に 8.2 の引き継ぎ |
| お問い合わせ | `inquiry_types` | `contact_inquiries`（C。管理者は U） |

---

## 10. セキュリティ・個人情報

### 10.1 アクセス権

PostgreSQL の行レベルセキュリティ（RLS）で、テーブルごとに読み書きできる人を決める。

| テーブル | だれでも（未ログインを含む） | ログイン中の本人 | 管理者（`role = 'admin'`） |
|---|---|---|---|
| マスタ・コンテンツ | 公開中（`is_published = true`）の行を参照 | 同左 | すべて参照・登録・更新 |
| `favorites` / `recent_views` / `style_profiles` / `style_profile_tastes` | — | **自分の行だけ** 参照・登録・更新・削除 | — |
| `users` | — | 自分の行だけ参照・更新 | 参照・`role` の更新 |
| `contact_inquiries` | 登録のみ | 登録のみ | 参照・更新 |
| `newsletter_subscriptions` | 登録のみ（確認・配信停止はメールのリンクから） | 同左 | 参照 |
| `audit_logs` | — | — | 参照のみ（登録はトリガーだけが行う。更新・削除はだれもできない） |

- 子テーブル（`trend_points` など）は、親が公開中のときだけ参照できるようにする。
- SQL はプレースホルダー（`$1` など）を使って組み立て、入力値を直接つなげない（SQLインジェクション対策）。
- 画面に出すときは、今までどおりエスケープしてから表示する（設計書 9.3）。DBにはHTMLを保存しない。

### 10.2 個人情報を持つテーブル

| テーブル | 個人情報 | 保存期間の目安 |
|---|---|---|
| `users` | メールアドレス | 退会まで。退会時に削除し、お気に入り・履歴・診断結果も一緒に消える（5章） |
| `contact_inquiries` | お名前、メールアドレス、お問い合わせ内容 | 対応完了から一定期間で削除する（期間は12章で決める） |
| `newsletter_subscriptions` | メールアドレス | 配信停止から一定期間で削除する（期間は12章で決める） |

お問い合わせフォームの表示どおり、お名前とメールアドレスはお問い合わせへの返信にだけ使う。

---

## 11. 運用

| 項目 | 内容 |
|---|---|
| コンテンツ更新（F-15） | 管理画面（F-22）ができるまでは、SQL または登録用スクリプトで更新する。新しいコンテンツは `is_published = false` で登録し、画面で確認してから `true` にする |
| 削除 | コンテンツは削除せず非公開にする。IDは変更・再利用しない（設計書 10.2 と同じ） |
| アイテムを非公開にするとき | そのアイテムを使っているコーデ・トレンドを先に見直す（管理画面で「◯件のコーデで使われています」と警告する） |
| アイテムの登録 | `products` と `product_links` は同じトランザクションで登録する（おすすめのショップのリンクがないとコミット時にエラーになる） |
| 変更履歴 | `audit_logs` は1年分を目安に残し、古いものは定期的に削除する（期間は12章で決める）。件数が多くなったら月ごとのパーティション分割を検討する |
| マスタの選択肢を廃止するとき | 削除せず `is_published = false` にする。使っているコンテンツがあると削除できない（RESTRICT） |
| 最近見たもの | 記録のたびに1人8件に削る（7.5）。まとめて削除する定期処理は不要 |
| キーワード検索（F-12） | データが数百件のうちは、今までどおり全件を読み込んで画面で検索する。件数が増えたら、表記ゆれをそろえた検索用の列と `pg_trgm`（部分一致検索のためのPostgreSQLの拡張機能）を検討する |
| バックアップ | マネージドサービスの自動バックアップ（毎日）を有効にし、7日分以上を残す |
| 定義の変更 | テーブルの変更はマイグレーションファイル（変更内容を書いたSQL）で管理し、Git に残す |

---

## 12. 未決事項

| # | 内容 | 決める時期 |
|---|---|---|
| 1 | 使うDBサービス（Supabase など）と認証サービス | F-21・F-22 の開発を始めるとき |
| 2 | お問い合わせ・メールマガジン（配信停止後）の個人情報の保存期間 | お問い合わせをDBに保存する前 |
| 3 | 購入リンクをアフィリエイトの商品ページURLに切り替えるか（`product_links.custom_url` に入れるだけで切り替えられる） | 収益化の方針を決めるとき |
| 4 | 価格の更新方法（手作業か、ECサイトのAPIから取得するか） | アイテムが増えてきたとき |
| 5 | `audit_logs` の保存期間 | 管理画面（F-22）の公開前 |
| 6 | 公開日時を指定して自動で公開する機能（予約公開）を作るか。作る場合はコンテンツに `publish_at` 列を追加する | 毎日の更新の運用が固まったとき |

---

## 13. 設計レビューの結果（v0.2）

v0.1 を、要件定義（F-01〜F-26）と次の4つの観点で見直した。見つかった問題と対応は次のとおり。

### 13.1 正規化とデータ整合性

| # | 確認したこと | 結果 | 対応 |
|---|---|---|---|
| 1 | 第3正規形を満たしているか | おおむね満たしていた。ただし `product_links.url` は `shops.search_url_template` と `products.search_keyword` から作れる値で、キーワードやショップの検索URLを変えると古いURLが残る（**更新時の不整合**） | URLは保存せず計算する形に変更。決まったURLにしたいときだけ `custom_url` に入れる（4.2、7.3） |
| 2 | 繰り返しの値を1列に入れていないか（第1正規形） | 配列（ポイント・コツ・年代など）はすべて子テーブル・中間テーブルに分けていて問題なし | — |
| 3 | 外部キー | 「おすすめのショップの購入リンクが必ずある」ことをアプリだけで守っていた | 外部キー `fk_products_recommended_link`（コミット時に確認）を追加 |
| 4 | CHECK 制約 | IDの形式（英小文字・数字・`_`）を決めていたのにDBで確認していなかった。メールマガジンの状態と日時が矛盾しうる。`main` の表示順が 0 であることを確認していなかった | ドメイン `code_id`、`ck_newsletter_subscriptions_dates`、`ck_outfit_products_sort_order`、子テーブルの表示順（1から）、メールアドレスの形式の CHECK を追加 |
| 5 | NULL 制約 | 空にしてよい列（`custom_url`、`last_login_at`、お気に入りの対象3列など）以外はすべて `NOT NULL` で問題なし | — |
| 6 | 一意制約 | 問題なし。制約の名前が自動で付いていてエラーの原因が分かりにくかった | 名前を付けた（13.3） |

### 13.2 パフォーマンスとインデックス

| # | 確認したこと | 結果 | 対応 |
|---|---|---|---|
| 1 | WHERE・ORDER BY に合ったインデックスか | シーン別コーデ（`scene_id` で絞って `sort_order` で並べる）、アイテム一覧（カテゴリーで絞って価格順）、トレンド一覧（`sort_order` 順）に合うインデックスがなかった | `idx_outfits_scene_id_sort_order`、`idx_products_category_id_price`、`idx_products_sort_order`、`idx_trends_sort_order` を追加（`scene_id`・`category_id` だけのインデックスは複合インデックスに置き換え） |
| 2 | JOIN に使う外部キーの列 | 診断結果（`style_profiles`・`style_profile_tastes`）のマスタへの外部キーにインデックスがなかった | 3つ追加 |
| 3 | 正規化しすぎて JOIN が多すぎないか | トレンド詳細は7テーブルを読む。ただし、どれも主キーの先頭（`trend_id`）で1件分だけを読むため速く、データも少ない。配列の列（`text[]`）にまとめると JOIN は減るが、第1正規形を満たさなくなり、検索や部分的な更新がしにくくなる | 子テーブルのまま（変更なし）。件数が増えて問題が出たら、詳細画面用のビューを作って1回のクエリで読めるようにする |
| 4 | 非正規化による更新時の不整合 | `product_links.url`（13.1 #1）のみ | 対応済み。`trends.post_count` は運営者が決める表示用の数字で、コーデの件数から計算する値ではないため、そのまま持つ。お問い合わせの `name`・`email` は送った時点の記録なので、そのまま持つ |

### 13.3 命名規則と一貫性

| # | 確認したこと | 結果 | 対応 |
|---|---|---|---|
| 1 | テーブル名・列名 | すべて英小文字のスネークケース、テーブル名は複数形で統一されていた | — |
| 2 | 外部キーの列名 | `recommended_shop_id` が「参照先の単数形 ＋ `_id`」の規則から外れていた | 「役割を表す言葉を前に付けてよい」と規則に書き足した（2.3） |
| 3 | 制約の名前 | CHECK 制約・一意制約の名前が自動（`favorites_check` など）で、規則がなかった | `ck_`・`uq_`・`fk_`・`idx_`・`trg_` の規則を決め、名前を付けた |
| 4 | 選択肢の持ち方 | マスタのテーブルと CHECK 制約の使い分けの基準がなかった | 「画面の選択肢はマスタ、内部の状態は CHECK」と決めた（2.3） |

### 13.4 拡張性と運用要件

| # | 確認したこと | 結果 | 対応 |
|---|---|---|---|
| 1 | 論理削除 | コンテンツは `is_published` で非公開にできたが、**マスタにはなかった**。使わなくなった選択肢（例：カラー）を隠す方法がなく、使われているため削除もできない | マスタにも `is_published` を追加。個人のデータは論理削除にせず本当に削除する方針を明記（2.4） |
| 2 | タイムスタンプ | マスタ・`product_links` に `created_at` / `updated_at` がなかった | 追加。持たないテーブルとその理由を明記（2.4） |
| 3 | ログ | 管理画面での変更を記録する仕組みがなく、まちがえて変えたときに元に戻せない | `audit_logs` とトリガーを追加（4.8） |
| 4 | 将来の拡張 | 会員登録（F-21）・管理画面（F-22）は v0.1 から考慮済み。予約公開は未検討 | 未決事項に追加（12章） |

### 13.5 確認の方法

付録A・Bを PostgreSQL（PGlite）で実行し、現在の `lib/data.ts` の全データを入れたうえで、次を確認した。

- 7章のSQLの結果が、画面の計算（コーデの合計金額・着回し数・購入リンクのURLと並び・コーデの絞り込みの全組み合わせ・診断のおすすめの全組み合わせ）と全件一致する。
- 追加した制約が、まちがったデータ（形式の違うID、購入リンクのないアイテム、矛盾したメールマガジンの状態など）を止める。
- 変更履歴が、変更した人・変更前後の値つきで記録され、個人のデータは記録されない。
- [ER図](er.md) の線と列が、DDLの外部キー・列と一致する。

---

## 付録A. DDL（PostgreSQL）

本書のテーブル定義をSQLにしたもの。空のデータベースで上から順に実行すると、34テーブル・インデックス・トリガーがすべて作られる。

```sql
-- ===== 共通：文字列ID（英小文字・数字・_ のみ、30文字まで） =====
CREATE DOMAIN code_id AS varchar(30) CHECK (VALUE ~ '^[a-z0-9_]+$');

-- ===== 共通：updated_at を自動で更新する関数 =====
CREATE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===== 1. マスタ =====
CREATE TABLE scenes (
  id           code_id     PRIMARY KEY,
  name         varchar(30) NOT NULL UNIQUE,
  icon         varchar(20) NOT NULL
               CONSTRAINT ck_scenes_icon CHECK (icon IN ('briefcase', 'bag', 'heart', 'sparkle', 'plane', 'home')),
  sort_order   smallint    NOT NULL DEFAULT 0,
  is_published boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE ages (
  id           code_id     PRIMARY KEY,
  name         varchar(30) NOT NULL UNIQUE,
  sort_order   smallint    NOT NULL DEFAULT 0,
  is_published boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE tastes (
  id           code_id     PRIMARY KEY,
  name         varchar(30) NOT NULL UNIQUE,
  sort_order   smallint    NOT NULL DEFAULT 0,
  is_published boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE categories (
  id           code_id     PRIMARY KEY,
  name         varchar(30) NOT NULL UNIQUE,
  sort_order   smallint    NOT NULL DEFAULT 0,
  is_published boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE colors (
  id           code_id     PRIMARY KEY,
  name         varchar(30) NOT NULL UNIQUE,
  sort_order   smallint    NOT NULL DEFAULT 0,
  is_published boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE post_tags (
  id           code_id     PRIMARY KEY,
  name         varchar(30) NOT NULL UNIQUE,
  sort_order   smallint    NOT NULL DEFAULT 0,
  is_published boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE inquiry_types (
  id           code_id     PRIMARY KEY,
  name         varchar(50) NOT NULL UNIQUE,
  sort_order   smallint    NOT NULL DEFAULT 0,
  is_published boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ===== 2. ショップ・アイテム =====
CREATE TABLE shops (
  id                  code_id      PRIMARY KEY,
  name                varchar(50)  NOT NULL UNIQUE,
  url                 varchar(500) NOT NULL,
  shop_type           varchar(30)  NOT NULL,
  search_url_template varchar(500)
                      CONSTRAINT ck_shops_search_url_template CHECK (search_url_template LIKE '%{q}%'),
  sort_order          integer      NOT NULL DEFAULT 0,
  is_published        boolean      NOT NULL DEFAULT true,
  created_at          timestamptz  NOT NULL DEFAULT now(),
  updated_at          timestamptz  NOT NULL DEFAULT now()
);

CREATE TABLE products (
  id                  code_id      PRIMARY KEY,
  name                varchar(100) NOT NULL,
  category_id         code_id      NOT NULL REFERENCES categories (id) ON DELETE RESTRICT,
  color_id            code_id      NOT NULL REFERENCES colors (id) ON DELETE RESTRICT,
  price               integer      NOT NULL CONSTRAINT ck_products_price CHECK (price >= 0),
  recommended_shop_id code_id      NOT NULL REFERENCES shops (id) ON DELETE RESTRICT,
  image               varchar(255) NOT NULL,
  search_keyword      varchar(100) NOT NULL,
  sort_order          integer      NOT NULL DEFAULT 0,
  is_published        boolean      NOT NULL DEFAULT true,
  created_at          timestamptz  NOT NULL DEFAULT now(),
  updated_at          timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_sort_order ON products (sort_order);
CREATE INDEX idx_products_category_id_price ON products (category_id, price);
CREATE INDEX idx_products_color_id ON products (color_id);
CREATE INDEX idx_products_price ON products (price);
CREATE INDEX idx_products_recommended_shop_id ON products (recommended_shop_id);

CREATE TABLE product_links (
  product_id code_id       NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  shop_id    code_id       NOT NULL REFERENCES shops (id) ON DELETE RESTRICT,
  custom_url varchar(1000),
  created_at timestamptz   NOT NULL DEFAULT now(),
  updated_at timestamptz   NOT NULL DEFAULT now(),
  PRIMARY KEY (product_id, shop_id)
);
CREATE INDEX idx_product_links_shop_id ON product_links (shop_id);

-- おすすめのショップの購入リンクが必ずあること（アイテムと購入リンクは同じトランザクションで登録する）
ALTER TABLE products
  ADD CONSTRAINT fk_products_recommended_link
  FOREIGN KEY (id, recommended_shop_id) REFERENCES product_links (product_id, shop_id)
  DEFERRABLE INITIALLY DEFERRED;

-- ===== 3. トレンド =====
CREATE TABLE trends (
  id           code_id      PRIMARY KEY,
  name         varchar(50)  NOT NULL,
  subtitle     varchar(100) NOT NULL,
  image        varchar(255) NOT NULL,
  hot_score    smallint     NOT NULL CONSTRAINT ck_trends_hot_score CHECK (hot_score BETWEEN 0 AND 100),
  season       varchar(30)  NOT NULL,
  post_count   integer      NOT NULL DEFAULT 0 CONSTRAINT ck_trends_post_count CHECK (post_count >= 0),
  description  text         NOT NULL,
  sort_order   integer      NOT NULL DEFAULT 0,
  is_published boolean      NOT NULL DEFAULT true,
  created_at   timestamptz  NOT NULL DEFAULT now(),
  updated_at   timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX idx_trends_sort_order ON trends (sort_order);

CREATE TABLE trend_images (
  trend_id   code_id      NOT NULL REFERENCES trends (id) ON DELETE CASCADE,
  sort_order smallint     NOT NULL CONSTRAINT ck_trend_images_sort_order CHECK (sort_order >= 1),
  image      varchar(255) NOT NULL,
  PRIMARY KEY (trend_id, sort_order)
);

CREATE TABLE trend_points (
  trend_id   code_id      NOT NULL REFERENCES trends (id) ON DELETE CASCADE,
  sort_order smallint     NOT NULL CONSTRAINT ck_trend_points_sort_order CHECK (sort_order >= 1),
  body       varchar(200) NOT NULL,
  PRIMARY KEY (trend_id, sort_order)
);

CREATE TABLE trend_tips (
  trend_id   code_id      NOT NULL REFERENCES trends (id) ON DELETE CASCADE,
  sort_order smallint     NOT NULL CONSTRAINT ck_trend_tips_sort_order CHECK (sort_order >= 1),
  body       varchar(200) NOT NULL,
  PRIMARY KEY (trend_id, sort_order)
);

CREATE TABLE trend_ages (
  trend_id code_id NOT NULL REFERENCES trends (id) ON DELETE CASCADE,
  age_id   code_id NOT NULL REFERENCES ages (id) ON DELETE RESTRICT,
  PRIMARY KEY (trend_id, age_id)
);
CREATE INDEX idx_trend_ages_age_id ON trend_ages (age_id);

CREATE TABLE trend_tastes (
  trend_id code_id NOT NULL REFERENCES trends (id) ON DELETE CASCADE,
  taste_id code_id NOT NULL REFERENCES tastes (id) ON DELETE RESTRICT,
  PRIMARY KEY (trend_id, taste_id)
);
CREATE INDEX idx_trend_tastes_taste_id ON trend_tastes (taste_id);

CREATE TABLE trend_products (
  trend_id   code_id  NOT NULL REFERENCES trends (id) ON DELETE CASCADE,
  product_id code_id  NOT NULL REFERENCES products (id) ON DELETE RESTRICT,
  sort_order smallint NOT NULL DEFAULT 0,
  PRIMARY KEY (trend_id, product_id)
);
CREATE INDEX idx_trend_products_product_id ON trend_products (product_id);

-- ===== 4. コーデ =====
CREATE TABLE outfits (
  id           code_id      PRIMARY KEY,
  scene_id     code_id      NOT NULL REFERENCES scenes (id) ON DELETE RESTRICT,
  title        varchar(100) NOT NULL,
  image        varchar(255) NOT NULL,
  description  text         NOT NULL,
  sort_order   integer      NOT NULL DEFAULT 0,
  is_published boolean      NOT NULL DEFAULT true,
  created_at   timestamptz  NOT NULL DEFAULT now(),
  updated_at   timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX idx_outfits_scene_id_sort_order ON outfits (scene_id, sort_order);

CREATE TABLE outfit_products (
  outfit_id  code_id     NOT NULL REFERENCES outfits (id) ON DELETE CASCADE,
  product_id code_id     NOT NULL REFERENCES products (id) ON DELETE RESTRICT,
  role       varchar(10) NOT NULL CONSTRAINT ck_outfit_products_role CHECK (role IN ('main', 'item')),
  sort_order smallint    NOT NULL DEFAULT 0,
  PRIMARY KEY (outfit_id, product_id),
  -- main は 0、item は 1 から
  CONSTRAINT ck_outfit_products_sort_order CHECK ((role = 'main') = (sort_order = 0) AND sort_order >= 0)
);
CREATE INDEX idx_outfit_products_product_id ON outfit_products (product_id);
-- 写真の主役アイテム（main）は1コーデに1つまで
CREATE UNIQUE INDEX uq_outfit_products_main ON outfit_products (outfit_id) WHERE role = 'main';

CREATE TABLE outfit_tips (
  outfit_id  code_id      NOT NULL REFERENCES outfits (id) ON DELETE CASCADE,
  sort_order smallint     NOT NULL CONSTRAINT ck_outfit_tips_sort_order CHECK (sort_order >= 1),
  body       varchar(200) NOT NULL,
  PRIMARY KEY (outfit_id, sort_order)
);

CREATE TABLE outfit_ages (
  outfit_id code_id NOT NULL REFERENCES outfits (id) ON DELETE CASCADE,
  age_id    code_id NOT NULL REFERENCES ages (id) ON DELETE RESTRICT,
  PRIMARY KEY (outfit_id, age_id)
);
CREATE INDEX idx_outfit_ages_age_id ON outfit_ages (age_id);

CREATE TABLE outfit_tastes (
  outfit_id code_id NOT NULL REFERENCES outfits (id) ON DELETE CASCADE,
  taste_id  code_id NOT NULL REFERENCES tastes (id) ON DELETE RESTRICT,
  PRIMARY KEY (outfit_id, taste_id)
);
CREATE INDEX idx_outfit_tastes_taste_id ON outfit_tastes (taste_id);

-- ===== 5. コラム・トップページ =====
CREATE TABLE posts (
  id           code_id      PRIMARY KEY,
  title        varchar(100) NOT NULL,
  tag_id       code_id      NOT NULL REFERENCES post_tags (id) ON DELETE RESTRICT,
  published_on date         NOT NULL,
  image        varchar(255) NOT NULL,
  excerpt      varchar(200) NOT NULL,
  is_published boolean      NOT NULL DEFAULT true,
  created_at   timestamptz  NOT NULL DEFAULT now(),
  updated_at   timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX idx_posts_tag_id ON posts (tag_id);
CREATE INDEX idx_posts_published_on ON posts (published_on DESC);

CREATE TABLE post_paragraphs (
  post_id    code_id  NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
  sort_order smallint NOT NULL CONSTRAINT ck_post_paragraphs_sort_order CHECK (sort_order >= 1),
  body       text     NOT NULL,
  PRIMARY KEY (post_id, sort_order)
);

CREATE TABLE hero_slides (
  id             integer      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  image          varchar(255) NOT NULL,
  image_position varchar(30)  NOT NULL DEFAULT 'center 30%',
  title          varchar(100) NOT NULL,
  body           varchar(200) NOT NULL,
  sort_order     integer      NOT NULL DEFAULT 0,
  is_published   boolean      NOT NULL DEFAULT true,
  created_at     timestamptz  NOT NULL DEFAULT now(),
  updated_at     timestamptz  NOT NULL DEFAULT now()
);

CREATE TABLE community_images (
  id           integer      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  image        varchar(255) NOT NULL,
  sort_order   integer      NOT NULL DEFAULT 0,
  is_published boolean      NOT NULL DEFAULT true,
  created_at   timestamptz  NOT NULL DEFAULT now(),
  updated_at   timestamptz  NOT NULL DEFAULT now()
);

-- ===== 6. ユーザー（F-21 会員登録の実現時に使う） =====
CREATE TABLE users (
  id            uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  email         varchar(254) NOT NULL,
  role          varchar(10)  NOT NULL DEFAULT 'member' CONSTRAINT ck_users_role CHECK (role IN ('member', 'admin')),
  last_login_at timestamptz,
  created_at    timestamptz  NOT NULL DEFAULT now(),
  updated_at    timestamptz  NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_users_email ON users (lower(email));

CREATE TABLE favorites (
  id         bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  trend_id   code_id     REFERENCES trends (id) ON DELETE CASCADE,
  outfit_id  code_id     REFERENCES outfits (id) ON DELETE CASCADE,
  product_id code_id     REFERENCES products (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  -- trend_id / outfit_id / product_id のうち、ちょうど1つだけに値が入る
  CONSTRAINT ck_favorites_one_target CHECK (num_nonnulls(trend_id, outfit_id, product_id) = 1),
  CONSTRAINT uq_favorites_user_id_trend_id UNIQUE (user_id, trend_id),
  CONSTRAINT uq_favorites_user_id_outfit_id UNIQUE (user_id, outfit_id),
  CONSTRAINT uq_favorites_user_id_product_id UNIQUE (user_id, product_id)
);
CREATE INDEX idx_favorites_user_id_created_at ON favorites (user_id, created_at);
CREATE INDEX idx_favorites_trend_id ON favorites (trend_id);
CREATE INDEX idx_favorites_outfit_id ON favorites (outfit_id);
CREATE INDEX idx_favorites_product_id ON favorites (product_id);

CREATE TABLE recent_views (
  id         bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  trend_id   code_id     REFERENCES trends (id) ON DELETE CASCADE,
  outfit_id  code_id     REFERENCES outfits (id) ON DELETE CASCADE,
  product_id code_id     REFERENCES products (id) ON DELETE CASCADE,
  viewed_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ck_recent_views_one_target CHECK (num_nonnulls(trend_id, outfit_id, product_id) = 1),
  CONSTRAINT uq_recent_views_user_id_trend_id UNIQUE (user_id, trend_id),
  CONSTRAINT uq_recent_views_user_id_outfit_id UNIQUE (user_id, outfit_id),
  CONSTRAINT uq_recent_views_user_id_product_id UNIQUE (user_id, product_id)
);
CREATE INDEX idx_recent_views_user_id_viewed_at ON recent_views (user_id, viewed_at DESC);
CREATE INDEX idx_recent_views_trend_id ON recent_views (trend_id);
CREATE INDEX idx_recent_views_outfit_id ON recent_views (outfit_id);
CREATE INDEX idx_recent_views_product_id ON recent_views (product_id);

CREATE TABLE style_profiles (
  user_id    uuid        PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  age_id     code_id     NOT NULL REFERENCES ages (id) ON DELETE RESTRICT,
  scene_id   code_id     NOT NULL REFERENCES scenes (id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_style_profiles_age_id ON style_profiles (age_id);
CREATE INDEX idx_style_profiles_scene_id ON style_profiles (scene_id);

CREATE TABLE style_profile_tastes (
  user_id  uuid     NOT NULL REFERENCES style_profiles (user_id) ON DELETE CASCADE,
  priority smallint NOT NULL CONSTRAINT ck_style_profile_tastes_priority CHECK (priority IN (1, 2)),
  taste_id code_id  NOT NULL REFERENCES tastes (id) ON DELETE RESTRICT,
  PRIMARY KEY (user_id, priority),
  CONSTRAINT uq_style_profile_tastes_user_id_taste_id UNIQUE (user_id, taste_id)
);
CREATE INDEX idx_style_profile_tastes_taste_id ON style_profile_tastes (taste_id);

-- ===== 7. 受付（メールマガジン・お問い合わせ） =====
CREATE TABLE newsletter_subscriptions (
  id              bigint       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email           varchar(254) NOT NULL CONSTRAINT ck_newsletter_subscriptions_email CHECK (email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$'),
  status          varchar(20)  NOT NULL DEFAULT 'pending'
                  CONSTRAINT ck_newsletter_subscriptions_status CHECK (status IN ('pending', 'active', 'unsubscribed')),
  confirmed_at    timestamptz,
  unsubscribed_at timestamptz,
  created_at      timestamptz  NOT NULL DEFAULT now(),
  updated_at      timestamptz  NOT NULL DEFAULT now(),
  -- 状態と日時の組み合わせが矛盾しないようにする
  CONSTRAINT ck_newsletter_subscriptions_dates CHECK (
    (status = 'pending'      AND confirmed_at IS NULL     AND unsubscribed_at IS NULL) OR
    (status = 'active'       AND confirmed_at IS NOT NULL AND unsubscribed_at IS NULL) OR
    (status = 'unsubscribed' AND unsubscribed_at IS NOT NULL)
  )
);
CREATE UNIQUE INDEX uq_newsletter_subscriptions_email ON newsletter_subscriptions (lower(email));

CREATE TABLE contact_inquiries (
  id              bigint       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id         uuid         REFERENCES users (id) ON DELETE SET NULL,
  name            varchar(50)  NOT NULL,
  email           varchar(254) NOT NULL CONSTRAINT ck_contact_inquiries_email CHECK (email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$'),
  inquiry_type_id code_id      NOT NULL REFERENCES inquiry_types (id) ON DELETE RESTRICT,
  message         text         NOT NULL CONSTRAINT ck_contact_inquiries_message CHECK (char_length(message) BETWEEN 10 AND 1000),
  status          varchar(20)  NOT NULL DEFAULT 'new'
                  CONSTRAINT ck_contact_inquiries_status CHECK (status IN ('new', 'in_progress', 'closed')),
  created_at      timestamptz  NOT NULL DEFAULT now(),
  updated_at      timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX idx_contact_inquiries_status_created_at ON contact_inquiries (status, created_at DESC);
CREATE INDEX idx_contact_inquiries_user_id ON contact_inquiries (user_id);
CREATE INDEX idx_contact_inquiries_inquiry_type_id ON contact_inquiries (inquiry_type_id);

-- ===== 8. 運用（変更履歴） =====
CREATE TABLE audit_logs (
  id         bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    uuid        REFERENCES users (id) ON DELETE SET NULL,
  table_name varchar(63) NOT NULL,
  action     varchar(10) NOT NULL CONSTRAINT ck_audit_logs_action CHECK (action IN ('insert', 'update', 'delete')),
  old_data   jsonb,
  new_data   jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ck_audit_logs_data CHECK (
    (action = 'insert' AND old_data IS NULL     AND new_data IS NOT NULL) OR
    (action = 'update' AND old_data IS NOT NULL AND new_data IS NOT NULL) OR
    (action = 'delete' AND old_data IS NOT NULL AND new_data IS NULL)
  )
);
CREATE INDEX idx_audit_logs_table_name_created_at ON audit_logs (table_name, created_at DESC);
CREATE INDEX idx_audit_logs_user_id ON audit_logs (user_id);

-- 変更した人は、アプリが接続ごとに SET app.user_id = '<ユーザーID>' で渡す
CREATE FUNCTION write_audit_log() RETURNS trigger AS $$
BEGIN
  INSERT INTO audit_logs (user_id, table_name, action, old_data, new_data)
  VALUES (
    nullif(current_setting('app.user_id', true), '')::uuid,
    TG_TABLE_NAME,
    lower(TG_OP),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) END
  );
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ===== トリガー =====
DO $$
DECLARE t text;
BEGIN
  -- updated_at を持つテーブルすべて
  FOR t IN
    SELECT table_name FROM information_schema.columns
    WHERE table_schema = 'public' AND column_name = 'updated_at'
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
      t, t
    );
  END LOOP;

  -- 変更履歴：運営者が管理するマスタ・コンテンツのテーブル（個人情報を含むテーブルは対象外）
  FOREACH t IN ARRAY ARRAY[
    'scenes', 'ages', 'tastes', 'categories', 'colors', 'post_tags', 'inquiry_types',
    'shops', 'products', 'product_links',
    'trends', 'trend_images', 'trend_points', 'trend_tips', 'trend_ages', 'trend_tastes', 'trend_products',
    'outfits', 'outfit_products', 'outfit_tips', 'outfit_ages', 'outfit_tastes',
    'posts', 'post_paragraphs', 'hero_slides', 'community_images'
  ]
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_audit AFTER INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION write_audit_log()',
      t, t
    );
  END LOOP;
END $$;
```

## 付録B. マスタの初期データ

現在の `data.js` の内容をマスタに入れるSQL。付録Aのあとに実行する。アイテム・トレンド・コーデ・コラムなどは、8.1 の対応表にしたがって `data.js` から変換して登録する。

```sql
INSERT INTO scenes (id, name, icon, sort_order) VALUES
  ('tsukin',   '通勤',       'briefcase', 1),
  ('kyujitsu', '休日',       'bag',       2),
  ('date',     'デート',     'heart',     3),
  ('oyobare',  'お呼ばれ',   'sparkle',   4),
  ('ryoko',    '旅行',       'plane',     5),
  ('ouchi',    'おうち時間', 'home',      6);

INSERT INTO ages (id, name, sort_order) VALUES
  ('20s', '20代', 1),
  ('30s', '30代', 2),
  ('40s', '40代', 3);

INSERT INTO tastes (id, name, sort_order) VALUES
  ('kireime',  'きれいめ',   1),
  ('casual',   'カジュアル', 2),
  ('feminine', 'フェミニン', 3),
  ('natural',  'ナチュラル', 4),
  ('simple',   'シンプル',   5);

INSERT INTO categories (id, name, sort_order) VALUES
  ('tops',     'トップス',     1),
  ('outer',    'アウター',     2),
  ('bottoms',  'ボトムス',     3),
  ('onepiece', 'ワンピース',   4),
  ('shoes',    'シューズ',     5),
  ('bag',      'バッグ',       6),
  ('acc',      'アクセサリー', 7);

INSERT INTO colors (id, name, sort_order) VALUES
  ('white',  '白',       1),
  ('gray',   'グレー',   2),
  ('beige',  'ベージュ', 3),
  ('black',  '黒',       4),
  ('kinari', '生成り',   5),
  ('camel',  'キャメル', 6),
  ('blue',   'ブルー',   7),
  ('floral', '花柄',     8),
  ('pink',   'ピンク',   9),
  ('brown',  'ブラウン', 10),
  ('gold',   'ゴールド', 11);

INSERT INTO post_tags (id, name, sort_order) VALUES
  ('trend',     'トレンド',   1),
  ('tsukin',    '通勤',       2),
  ('kimawashi', '着回し',     3),
  ('kisetsu',   '季節のコツ', 4);

INSERT INTO inquiry_types (id, name, sort_order) VALUES
  ('content',  '掲載内容について',         1),
  ('shop',     '商品・ショップについて',   2),
  ('bug',      '不具合のご報告',           3),
  ('business', '広告・取材・提携について', 4),
  ('other',    'その他',                   5);

INSERT INTO shops (id, name, url, shop_type, search_url_template, sort_order) VALUES
  ('uniqlo',          'UNIQLO',          'https://www.uniqlo.com/jp/ja/',           'ベーシック',       NULL, 1),
  ('gu',              'GU',              'https://www.gu-global.com/jp/ja/',        'トレンドプチプラ', NULL, 2),
  ('zozotown',        'ZOZOTOWN',        'https://zozo.jp/',                        'ファッション通販', NULL, 3),
  ('rakuten_fashion', 'Rakuten Fashion', 'https://brandavenue.rakuten.co.jp/',      'ブランド通販',     NULL, 4),
  ('shimamura',       'しまむら',        'https://www.shop-shimamura.com/',         'プチプラ',         NULL, 5),
  ('united_arrows',   'UNITED ARROWS',   'https://store.united-arrows.co.jp/',      'セレクトショップ', NULL, 6),
  ('lumine',          'LUMINE',          'https://www.lumine.ne.jp/',               'ファッションビル', NULL, 7),
  ('rakuten',         '楽天市場',        'https://www.rakuten.co.jp/',              '総合通販',         'https://search.rakuten.co.jp/search/mall/{q}/', 8),
  ('amazon',          'Amazon',          'https://www.amazon.co.jp/fashion',        '総合通販',         'https://www.amazon.co.jp/s?k={q}', 9);
```

---

## 改訂履歴

| 版数 | 日付 | 内容 |
|---|---|---|
| v0.1 | 2026年9月29日 | 初版作成（現在の `data.js` / `lib/data.ts` と localStorage の構造、設計書 v0.1 にもとづく） |
| v0.2 | 2026年9月29日 | 設計レビューを反映（13章）。購入リンクのURLを計算で求める形に変更、制約・インデックス・マスタの論理削除とタイムスタンプ・変更履歴（`audit_logs`）を追加 |
