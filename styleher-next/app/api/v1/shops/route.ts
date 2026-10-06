// A-08 ショップ一覧
import { api, json, route } from "@/lib/api/http";
import { bySortOrder } from "@/lib/api/serializers";
import { db } from "@/lib/api/store";

export const { GET, POST, PUT, PATCH, DELETE } = route({
  GET: api(
    () =>
      json({
        items: db.shops
          .filter((s) => s.isPublished)
          .sort(bySortOrder)
          .map((s) => ({ id: s.id, name: s.name, url: s.url, shopType: s.shopType })),
      }),
    { cache: "public" }
  ),
});
