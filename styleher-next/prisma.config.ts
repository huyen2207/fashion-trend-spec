// Prisma CLI（migrate / db pull / studio など）の設定。
// .env は自動では読まれないため dotenv で読み込む。
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    // 初期データの登録（npm run db:seed）
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // マイグレーションはコネクションプーラー（PgBouncer）を通さない直接接続で行う。
    // DIRECT_URL が無いときは DATABASE_URL を使う
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
