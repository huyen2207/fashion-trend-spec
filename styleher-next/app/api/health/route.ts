// Z-01 稼働確認（docs/api.md 4.5）。バージョンなし・認証なし
import { api, json, route } from "@/lib/api/http";
import { prisma } from "@/lib/db";

export const { GET, POST, PUT, PATCH, DELETE } = route({
  // DB に問い合わせできるかを確認する。つながらないときは 503
  GET: api(async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return json({ status: "ok" });
    } catch (e) {
      console.error("[api] 稼働確認：DB に接続できません", e);
      return json({ status: "unavailable" }, 503);
    }
  }),
});
