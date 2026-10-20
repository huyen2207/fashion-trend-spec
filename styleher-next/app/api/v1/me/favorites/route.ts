// C-03 お気に入り一覧（種類ごとに、登録した順。非公開になったものは返さない）
import { loadCatalog, type ItemType } from "@/lib/api/catalog";
import { api, json, route } from "@/lib/api/http";
import { itemOf } from "@/lib/api/member";
import { itemSummary } from "@/lib/api/serializers";
import { prisma } from "@/lib/db";

export const { GET, POST, PUT, PATCH, DELETE } = route({
  GET: api(
    async ({ user }) => {
      const [rows, c] = await Promise.all([
        prisma.favorite.findMany({ where: { userId: user!.id }, orderBy: [{ createdAt: "asc" }, { id: "asc" }] }),
        loadCatalog(),
      ]);
      const mine = rows.map(itemOf);
      const list = (type: ItemType) => mine.filter((f) => f.type === type).map((f) => itemSummary(c, type, f.itemId)).filter(Boolean);
      return json({ trends: list("trend"), outfits: list("outfit"), products: list("product") });
    },
    { auth: "member" }
  ),
});
