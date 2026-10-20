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

## API（ダミーデータ版）

[API設計書](../docs/api.md) にもとづく Web API です。**データベースにはつながず**、`lib/data.ts` から作ったダミーデータをサーバーのメモリに持ちます。登録・変更はサーバーを再起動すると元に戻ります。

- URL：`http://localhost:3000/api/v1/...`（稼働確認だけ `/api/health`）
- 画面（トップページ・詳細・検索・診断）は、このAPIからデータを取って表示します（`lib/client/`）。`lib/data.ts` は、APIのダミーデータの元としてだけ使います。
- お気に入り・最近見たもの・診断結果は、ログイン機能ができるまでブラウザ（localStorage）に保存します。表示する内容は、保存したIDで API から取ります。

**ログインの代わり（ダミーのトークン）**

認証サービスの代わりに、次の固定のトークンを `Authorization` ヘッダーに付けます。

| トークン | 本人 | 使えるAPI |
|---|---|---|
| `dummy-member-token` | 一般会員（hanako@example.com） | 会員API（`/me/...`） |
| `dummy-admin-token` | 管理者（admin@example.com） | 会員API・管理API（`/admin/...`） |

**試し方の例**

```bash
curl http://localhost:3000/api/v1/trends/brown
```

```bash
curl "http://localhost:3000/api/v1/products?category=outer&sort=price_asc"
```

```bash
curl -X PUT -H "Authorization: Bearer dummy-member-token" http://localhost:3000/api/v1/me/favorites/products/p07
```

```bash
curl -H "Authorization: Bearer dummy-member-token" http://localhost:3000/api/v1/me/favorites
```

**メール（ダミー）**：メールマガジンの確認メールなどは送らず、開発中だけサーバーのログに「[ダミーのメール送信]」として内容（確認のリンク）を出します。リンク先のページ（`/newsletter`）はまだありません。

**ファイル**

| ファイル | 役割 |
|---|---|
| `app/api/v1/**/route.ts` | 各API（設計書の A-01〜D-10）。`app/api/health/route.ts` は稼働確認 |
| `app/api/[...path]/route.ts` | どのAPIにも当てはまらないパスに、共通の形の 404 を返す |
| `lib/api/store.ts` | ダミーデータ（DBの代わり）。`lib/data.ts` から DB設計書のテーブルと同じ形に作る |
| `lib/api/http.ts` | 共通処理：エラーの形、リクエストID、キャッシュ・ETag、回数の制限、405、本文の読み込み、ページ分け、入力チェック |
| `lib/api/auth.ts` | ダミーの認証 |
| `lib/api/serializers.ts` | レスポンスの形（TrendSummary など）、購入リンク・着回し数・合計金額の計算 |
| `lib/api/admin.ts` | 管理APIで扱うリソースの入力チェックと、変更履歴 |
| `lib/api/member.ts` / `recommend.ts` / `query.ts` / `tokens.ts` / `mail.ts` | 会員API・診断のおすすめ・マスタIDの確認・メールマガジンのトークン・ダミーのメール |
| `lib/client/api.ts` | 画面から API を呼ぶ仕組み（`useApi`）：レスポンスの型、読み込み中・エラーの状態、同じURLの結果の再利用 |
| `lib/client/useItems.ts` | お気に入り・最近見たもののIDから、表示用の内容をまとめて取る |

## ファイル構成

| ファイル | 役割 |
|---|---|
| `app/layout.tsx` | 全ページ共通の骨組み（ヘッダー・フッター・詳細ダイアログ・お気に入り・通知・フォント） |
| `app/page.tsx` | トップページ（`/`） |
| `app/contact/page.tsx` | お問い合わせページ（`/contact`） |
| `app/globals.css` | Tailwind CSS と、StyleHer の色・フォント（shadcn/ui のテーマ） |
| `components/ui/` | shadcn/ui のコンポーネント（`npx shadcn@latest add ◯◯` で追加） |
| `lib/data.ts` | APIのダミーデータの元（トレンド・コーデ・アイテムなど）。毎日の更新はここを書き換える |
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
