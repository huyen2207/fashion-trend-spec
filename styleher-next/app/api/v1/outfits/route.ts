// A-04 コーデ一覧（シーン・年代・テイストで絞り込み。条件は AND）
import { api, json, route, Validator } from "@/lib/api/http";
import { isAge, isScene, isTaste, optionalRef } from "@/lib/api/query";
import { outfitSummary, publishedOutfits } from "@/lib/api/serializers";

export const { GET, POST, PUT, PATCH, DELETE } = route({
  GET: api(
    ({ req }) => {
      const sp = req.nextUrl.searchParams;
      const v = new Validator();
      const scene = optionalRef(v, sp.get("scene"), "scene", "シーン", isScene);
      const age = optionalRef(v, sp.get("age"), "age", "年代", isAge);
      const taste = optionalRef(v, sp.get("taste"), "taste", "テイスト", isTaste);
      const ids = v.idsParam(sp.get("ids"));
      v.check();
      const items = publishedOutfits().filter(
        (o) =>
          (!scene || o.sceneId === scene) &&
          (!age || o.ageIds.includes(age)) &&
          (!taste || o.tasteIds.includes(taste)) &&
          (!ids || ids.includes(o.id))
      );
      return json({ items: items.map(outfitSummary) });
    },
    { cache: "public" }
  ),
});
