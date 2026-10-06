// A-12 コミュニティ告知の画像
import { api, json, route } from "@/lib/api/http";
import { bySortOrder } from "@/lib/api/serializers";
import { db } from "@/lib/api/store";

export const { GET, POST, PUT, PATCH, DELETE } = route({
  GET: api(
    () => json({ items: db.communityImages.filter((x) => x.isPublished).sort(bySortOrder).map((x) => ({ id: x.id, image: x.image })) }),
    { cache: "public" }
  ),
});
