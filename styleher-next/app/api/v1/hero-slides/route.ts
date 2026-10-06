// A-11 メインビジュアル
import { api, json, route } from "@/lib/api/http";
import { bySortOrder } from "@/lib/api/serializers";
import { db } from "@/lib/api/store";

export const { GET, POST, PUT, PATCH, DELETE } = route({
  GET: api(
    () =>
      json({
        items: db.heroSlides
          .filter((h) => h.isPublished)
          .sort(bySortOrder)
          .map((h) => ({ id: h.id, image: h.image, imagePosition: h.imagePosition, title: h.title, body: h.body })),
      }),
    { cache: "public" }
  ),
});
