// A-07 アイテム詳細（ショップ比較・着回し提案）
import { loadCatalog } from "@/lib/api/catalog";
import { api, errors, json, route } from "@/lib/api/http";
import { findPublished, productDetail } from "@/lib/api/serializers";

export const { GET, POST, PUT, PATCH, DELETE } = route({
  GET: api(
    async ({ params }) => {
      const c = await loadCatalog();
      const p = findPublished.product(c, params.productId);
      if (!p) throw errors.notFound("アイテムが見つかりません。");
      return json(productDetail(c, p));
    },
    { cache: "public" }
  ),
});
