// A-02 トレンド一覧
import { api, json, route, Validator } from "@/lib/api/http";
import { isAge, optionalRef } from "@/lib/api/query";
import { publishedTrends, trendSummary } from "@/lib/api/serializers";

export const { GET, POST, PUT, PATCH, DELETE } = route({
  GET: api(
    ({ req }) => {
      const sp = req.nextUrl.searchParams;
      const v = new Validator();
      const age = optionalRef(v, sp.get("age"), "age", "年代", isAge);
      const ids = v.idsParam(sp.get("ids"));
      v.check();
      const items = publishedTrends().filter((t) => (!age || t.ageIds.includes(age)) && (!ids || ids.includes(t.id)));
      return json({ items: items.map(trendSummary) });
    },
    { cache: "public" }
  ),
});
