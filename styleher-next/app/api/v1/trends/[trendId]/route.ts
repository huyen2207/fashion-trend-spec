// A-03 トレンド詳細
import { loadCatalog } from "@/lib/api/catalog";
import { api, errors, json, route } from "@/lib/api/http";
import { findPublished, trendDetail } from "@/lib/api/serializers";

export const { GET, POST, PUT, PATCH, DELETE } = route({
  GET: api(
    async ({ params }) => {
      const c = await loadCatalog();
      const t = findPublished.trend(c, params.trendId);
      if (!t) throw errors.notFound("トレンドが見つかりません。");
      return json(trendDetail(c, t));
    },
    { cache: "public" }
  ),
});
