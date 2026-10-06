// Z-01 稼働確認（docs/api.md 4.5）。バージョンなし・認証なし
import { api, json, route } from "@/lib/api/http";
import { db } from "@/lib/api/store";

export const { GET, POST, PUT, PATCH, DELETE } = route({
  // ダミー版ではDBの代わりにメモリのデータが読めるかを確認する
  GET: api(() => json(Array.isArray(db.trends) ? { status: "ok" } : { status: "unavailable" }, Array.isArray(db.trends) ? 200 : 503)),
});
