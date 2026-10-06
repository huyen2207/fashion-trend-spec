// A-03 トレンド詳細
import { api, errors, json, route } from "@/lib/api/http";
import { findPublished, trendDetail } from "@/lib/api/serializers";

export const { GET, POST, PUT, PATCH, DELETE } = route({
  GET: api(
    ({ params }) => {
      const t = findPublished.trend(params.trendId);
      if (!t) throw errors.notFound("トレンドが見つかりません。");
      return json(trendDetail(t));
    },
    { cache: "public" }
  ),
});
