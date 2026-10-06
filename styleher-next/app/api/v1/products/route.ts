// A-06 アイテム一覧（絞り込み・並び替え・ページ分け）
import { api, json, pageParams, paginate, route, Validator } from "@/lib/api/http";
import { isCategory, isColor, optionalRef } from "@/lib/api/query";
import { outfitsWith, productSummary, publishedProducts } from "@/lib/api/serializers";

const SORTS = ["recommended", "price_asc", "price_desc", "wear_count_desc"] as const;
type Sort = (typeof SORTS)[number];

export const { GET, POST, PUT, PATCH, DELETE } = route({
  GET: api(
    (c) => {
      const sp = c.req.nextUrl.searchParams;
      const v = new Validator();
      const category = optionalRef(v, sp.get("category"), "category", "カテゴリー", isCategory);
      const color = optionalRef(v, sp.get("color"), "color", "カラー", isColor);
      const minPrice = v.intParam(sp.get("minPrice"), "minPrice", { min: 0 });
      const maxPrice = v.intParam(sp.get("maxPrice"), "maxPrice", { min: 0 });
      if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice)
        v.add("minPrice", "minPrice は maxPrice 以下にしてください。");
      const sort = (sp.get("sort") ?? "recommended") as Sort;
      if (!SORTS.includes(sort)) v.add("sort", `sort は ${SORTS.join(" / ")} のいずれかにしてください。`);
      const ids = v.idsParam(sp.get("ids"));
      const page = pageParams(c, 10, 50, v);
      v.check();

      // おすすめ順（sort_order）で並べてから絞り込み・並び替える。同じ値のときはおすすめ順のまま（安定ソート）
      const rows = publishedProducts().filter(
        (p) =>
          (!category || p.categoryId === category) &&
          (!color || p.colorId === color) &&
          (minPrice === undefined || p.price >= minPrice) &&
          (maxPrice === undefined || p.price <= maxPrice) &&
          (!ids || ids.includes(p.id))
      );
      const wear = new Map(rows.map((p) => [p.id, outfitsWith(p.id).length]));
      if (sort === "price_asc") rows.sort((a, b) => a.price - b.price);
      if (sort === "price_desc") rows.sort((a, b) => b.price - a.price);
      if (sort === "wear_count_desc") rows.sort((a, b) => wear.get(b.id)! - wear.get(a.id)!);

      const result = paginate(rows, page);
      return json({ ...result, items: result.items.map(productSummary) });
    },
    { cache: "public" }
  ),
});
