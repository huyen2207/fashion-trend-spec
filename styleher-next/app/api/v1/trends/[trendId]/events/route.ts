// B-04 トレンドへの反応を記録する（詳細を開いた・お気に入りにした・外した）。注目度の計算に使う（docs/db.md 7.1）
// ログインしていなくても数える。だれが反応したかは持たず、トレンドごと・日ごとの回数だけを持つ
import { todayJst } from "@/lib/api/catalog";
import { api, errors, noContent, RATE_LIMITS, readJson, route, Validator } from "@/lib/api/http";
import { isPublishedItem } from "@/lib/api/member";
import { prisma } from "@/lib/db";

// 種類 → 足す回数（詳細を開いた回数, お気に入りの数）
const EVENTS = { view: [1, 0], favorite: [0, 1], unfavorite: [0, -1] } as const;
type EventType = keyof typeof EVENTS;

export const { GET, POST, PUT, PATCH, DELETE } = route({
  POST: api(
    async ({ req, params }) => {
      const body = await readJson(req);
      const v = new Validator();
      if (!(typeof body.type === "string" && Object.hasOwn(EVENTS, body.type)))
        v.add("type", "type は view / favorite / unfavorite のいずれかにしてください。");
      v.check();
      if (!(await isPublishedItem("trend", params.trendId))) throw errors.notFound("トレンドが見つかりません。");

      const [views, favorites] = EVENTS[body.type as EventType];
      await prisma.$executeRaw`
        INSERT INTO trend_daily_stats (trend_id, stat_date, view_count, favorite_count)
        VALUES (${params.trendId}, ${todayJst().toISOString().slice(0, 10)}::date, ${views}, ${favorites})
        ON CONFLICT (trend_id, stat_date) DO UPDATE SET
          view_count = trend_daily_stats.view_count + EXCLUDED.view_count,
          favorite_count = trend_daily_stats.favorite_count + EXCLUDED.favorite_count`;
      return noContent();
    },
    { rateLimit: RATE_LIMITS.trendEvent }
  ),
});
