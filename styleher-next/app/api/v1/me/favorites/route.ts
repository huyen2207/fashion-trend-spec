// C-03 お気に入り一覧（種類ごとに、登録した順。非公開になったものは返さない）
import { api, json, route } from "@/lib/api/http";
import { itemSummary } from "@/lib/api/serializers";
import { db, type ItemType } from "@/lib/api/store";

export const { GET, POST, PUT, PATCH, DELETE } = route({
  GET: api(
    ({ user }) => {
      const mine = db.favorites.filter((f) => f.userId === user!.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id - b.id);
      const list = (type: ItemType) => mine.filter((f) => f.type === type).map((f) => itemSummary(type, f.itemId)).filter(Boolean);
      return json({ trends: list("trend"), outfits: list("outfit"), products: list("product") });
    },
    { auth: "member" }
  ),
});
