// A-09 コラム一覧（公開日の新しい順。同じ日はIDの順）
import { api, json, pageParams, paginate, route, Validator } from "@/lib/api/http";
import { isPostTag, optionalRef } from "@/lib/api/query";
import { postSummary } from "@/lib/api/serializers";
import { db } from "@/lib/api/store";

export const { GET, POST, PUT, PATCH, DELETE } = route({
  GET: api(
    (c) => {
      const v = new Validator();
      const tag = optionalRef(v, c.req.nextUrl.searchParams.get("tag"), "tag", "タグ", isPostTag);
      const page = pageParams(c, 20, 50, v);
      v.check();
      const rows = db.posts
        .filter((p) => p.isPublished && (!tag || p.tagId === tag))
        .sort((a, b) => b.publishedOn.localeCompare(a.publishedOn) || a.id.localeCompare(b.id));
      const result = paginate(rows, page);
      return json({ ...result, items: result.items.map(postSummary) });
    },
    { cache: "public" }
  ),
});
