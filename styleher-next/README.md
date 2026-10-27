# StyleHer（Next.js 版）

親フォルダの静的サイト（`index.html` / `script.js` / `data.js` / `style.css`）を、Next.js（App Router + TypeScript）と shadcn/ui（Tailwind CSS）で作り直し、Framer Motion（`motion`）でアニメーションを付けたものです。

端末の「視差効果を減らす」（動きを減らす）設定が有効な場合、移動や拡大のアニメーションは自動で止まります。

## 動かし方

```bash
npm install
npm run dev      # 開発用サーバー http://localhost:3000
npm run build    # 本番用にビルドする
npm start        # ビルドしたものを動かす（http://localhost:3000）
```

API（`app/api`）を動かすため、静的サイトとしての書き出し（`out/`）はやめました。公開するときは、Node.js が動く環境（Vercel など）に置きます。

## データベース（Prisma + Neon）

[DB設計書](../docs/db.md) のテーブル（34テーブル）を、ORM の [Prisma](https://www.prisma.io/) で Neon（PostgreSQL）に作っています。API（下の「API」）はこの DB を読み書きします。

1. `.env.example` をコピーして `.env` を作り、Neon の接続文字列を入れる（`.env` はコミットしない）
   - `DATABASE_URL`：アプリ用。Connection pooling を ON にした `-pooler` 付きのホスト
   - `DIRECT_URL`：マイグレーション用。`-pooler` なしのホスト
2. 次のコマンドを使う（初めてのときは `db:deploy` → `db:seed` の順に実行する）

```bash
npm run db:check     # DB に接続できるか確認する
npm run db:deploy    # まだ反映していないマイグレーションを DB に反映する
npm run db:seed      # 初期データ（lib/data.ts の内容と、ログインできる開発用の会員2人）を入れる。DB が空のときだけ
npm run db:seed -- --reset   # すべてのテーブルを空にして、初期データを入れ直す（お気に入り・お問い合わせなども消える）
npm run db:migrate   # schema.prisma を変えたあと、新しいマイグレーションを作って反映する（開発用）
npm run db:studio    # ブラウザで DB の中身を見る
```

| ファイル | 内容 |
|---|---|
| `prisma/schema.prisma` | テーブルの定義（Prisma のモデル） |
| `prisma/migrations/` | DB に流した SQL。最初のもの（`*_init`）は DB設計書の付録Aの DDL そのもの |
| `prisma/seed.ts` | 初期データの登録。`lib/data.ts` を DB設計書 8.1 の対応表にしたがって変換する |
| `prisma.config.ts` | Prisma のコマンドの設定 |
| `lib/db.ts` | アプリから使う Prisma Client（`import { prisma } from "@/lib/db"`） |

CHECK 制約・トリガー・大文字小文字を区別しない一意インデックス・コミット時に確認する外部キーは Prisma のスキーマでは表せないため、マイグレーションの SQL にだけ書いてあります。`npm run db:migrate` で新しいマイグレーションを作ったら、これらを消す SQL が入っていないか確認してください。

## API

[API設計書](../docs/api.md) にもとづく Web API です。データは Neon の DB に保存します（上の「データベース」）。ログインは next-auth（メールアドレスとパスワード）で行います。メールの送信だけは、まだダミーです。

- URL：`http://localhost:3000/api/v1/...`（稼働確認だけ `/api/health`）
- 画面（トップページ・詳細・検索・診断）は、このAPIからデータを取って表示します（`lib/client/`）。`lib/data.ts` は、初期データ（`npm run db:seed`）の元としてだけ使います。
- マスタ・コンテンツは件数が少ないため、リクエストごとに DB からまとめて読み込んでから絞り込みます（`lib/api/catalog.ts`。DB設計書 11章）。
- 管理APIで変更すると、DB のトリガーが変更履歴（`audit_logs`）に記録します。変更した人は、同じトランザクションで `app.user_id` に入れて渡します。
- 回数の制限とお問い合わせの二重送信の防止（Idempotency-Key）は、今のところサーバーのメモリに持ちます（再起動すると消えます）。
- お気に入り・最近見たもの・診断結果は、ログイン機能ができるまでブラウザ（localStorage）に保存します。表示する内容は、保存したIDで API から取ります。

**ログイン（next-auth）**

`/login` でメールアドレスとパスワードを入れてログインします（ヘッダー右上のアイコンからも開けます）。ログインの状態は、next-auth が発行する Cookie（署名・暗号化した JWT）で持ち、API はこの Cookie から本人を決めます。

| 開発用の会員 | 使えるAPI |
|---|---|
| 一般会員（hanako@example.com） | 会員API（`/me/...`） |
| 管理者（admin@example.com） | 会員API・管理API（`/admin/...`） |

- パスワードは `prisma/seed.ts` の `DEV_USERS` にあります（開発用。DB には bcrypt のハッシュだけを保存します）。
- ログイン機能を入れる前に初期データを入れた DB では、次のコマンドでパスワードを設定します。

```bash
npm run user:set-password -- hanako@example.com <パスワード>
```

- `.env` に `AUTH_SECRET` が必要です（`.env.example` を参照）。Vercel 以外で `next start` するときは `AUTH_TRUST_HOST=true` も設定します。
- ログインしていないと会員API・管理APIは `401`、管理者でない人が管理APIを呼ぶと `403` です。管理者かどうかは、毎回 DB の `users.role` で確認します。
- 同じIPからのログインは10分に10回までです（パスワードの総当たりを防ぐため）。

**試し方の例**

```bash
curl http://localhost:3000/api/v1/trends/brown
```

```bash
curl "http://localhost:3000/api/v1/products?category=outer&sort=price_asc"
```

会員APIは、ブラウザでログインしてから開くか、curl で Cookie を使ってログインしてから呼びます。

```bash
curl -s -c cookie.txt http://localhost:3000/api/auth/csrf
```

上で表示された `csrfToken` を使ってログインします。

```bash
curl -s -b cookie.txt -c cookie.txt -X POST http://localhost:3000/api/auth/callback/credentials --data-urlencode "csrfToken=<csrfToken>" --data-urlencode "email=hanako@example.com" --data-urlencode "password=<パスワード>"
```

```bash
curl -b cookie.txt http://localhost:3000/api/v1/me/favorites
```

**メール（ダミー）**：メールマガジンの確認メールなどは送らず、開発中だけサーバーのログに「[ダミーのメール送信]」として内容（確認のリンク）を出します。リンク先のページ（`/newsletter`）はまだありません。

**ファイル**

| ファイル | 役割 |
|---|---|
| `app/api/v1/**/route.ts` | 各API（設計書の A-01〜D-10）。`app/api/health/route.ts` は稼働確認 |
| `app/api/[...path]/route.ts` | どのAPIにも当てはまらないパスに、共通の形の 404 を返す |
| `lib/api/catalog.ts` | DB からマスタ・コンテンツを読み込み、子テーブルを配列にした形（`TrendRow` など）にする |
| `lib/api/http.ts` | 共通処理：エラーの形、リクエストID、キャッシュ・ETag、回数の制限、405、本文の読み込み、ページ分け、入力チェック |
| `auth.ts` | next-auth の設定（メールアドレスとパスワードでのログイン、ログインの試行回数の制限） |
| `app/api/auth/[...nextauth]/route.ts` | next-auth の入口（`/api/auth/...`：ログイン・ログアウト・セッション） |
| `lib/api/auth.ts` | API の認証・認可（セッションの本人を DB の `users` から読み、会員・管理者を確認する） |
| `lib/auth/password.ts` | パスワードのハッシュ（bcrypt） |
| `lib/api/serializers.ts` | レスポンスの形（TrendSummary など）、購入リンク・着回し数・合計金額の計算 |
| `lib/api/admin.ts` | 管理APIで扱うリソースの入力チェックと保存（子テーブルの入れ直し・変更した人の受け渡し） |
| `lib/api/member.ts` / `recommend.ts` / `query.ts` / `tokens.ts` / `mail.ts` | 会員API・診断のおすすめ・マスタIDの確認・メールマガジンのトークン・ダミーのメール |
| `lib/client/api.ts` | 画面から API を呼ぶ仕組み（`useApi`）：レスポンスの型、読み込み中・エラーの状態、同じURLの結果の再利用 |
| `lib/client/useItems.ts` | お気に入り・最近見たもののIDから、表示用の内容をまとめて取る |

## ファイル構成

| ファイル | 役割 |
|---|---|
| `app/layout.tsx` | 全ページ共通の骨組み（ヘッダー・フッター・詳細ダイアログ・お気に入り・通知・フォント） |
| `app/page.tsx` | トップページ（`/`） |
| `app/contact/page.tsx` | お問い合わせページ（`/contact`） |
| `app/login/page.tsx` / `components/LoginForm.tsx` | ログインページ（`/login`） |
| `app/globals.css` | Tailwind CSS と、StyleHer の色・フォント（shadcn/ui のテーマ） |
| `components/ui/` | shadcn/ui のコンポーネント（`npx shadcn@latest add ◯◯` で追加） |
| `lib/data.ts` | 初期データの元（トレンド・コーデ・アイテムなど）。`npm run db:seed` で DB に入れる。毎日の更新は管理API（`/admin/...`）で DB を書き換える |
| `lib/utils.ts` | 画像URL・価格表示・ブラウザ保存などの共通処理 |
| `components/ShopSection.tsx` | 人気ショップ（API から読む） |
| `components/StoreProvider.tsx` | お気に入り・最近見たもの・ダイアログの状態管理 |
| `components/Overlays.tsx` | 詳細（トレンド・コーデ・アイテム・コラム）・検索のダイアログと、お気に入りのシート |
| `components/ContactForm.tsx` | お問い合わせフォーム |
| `components/motion.tsx` | アニメーションの共通部品（Framer Motion ＝ `motion` ライブラリ）。`Reveal`（スクロールで表示）、`Stagger` / `StaggerItem`（順番に表示・絞り込み時に移動） |
| `app/template.tsx` | ページを移動したときのフェード |
| `components/*Section.tsx` ほか | トップページの各セクション |

お気に入り・閲覧履歴・診断結果は、元のサイトと同じキー（`styleher:*`）でブラウザに保存します。

## お問い合わせフォーム

何も設定しない場合は **デモ** として動きます（入力チェックと完了表示のみで、どこにも送信しません）。

実際にメールで受け取るには、[Formspree](https://formspree.io/) などのフォーム受付サービスでフォームを作り、発行された URL を `.env.local` に書いてから、もう一度 `npm run build` してください。

```
NEXT_PUBLIC_CONTACT_ENDPOINT=https://formspree.io/f/xxxxxxxx
```

送信内容（JSON）: `name`（お名前）/ `email`（メールアドレス）/ `type`（お問い合わせの種類）/ `message`（内容）
