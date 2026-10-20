// A-14 キーワード検索（docs/api.md 5.14。画面の検索と同じ項目・同じ表記ゆれの扱い）
// データが数百件のうちは、全件を読み込んでから絞り込む（docs/db.md 11章）
import { loadCatalog, type MasterRow } from "@/lib/api/catalog";
import { api, json, route, Validator } from "@/lib/api/http";
import {
  bySortOrder,
  outfitSummary,
  plain,
  postSummary,
  productSummary,
  publishedOutfits,
  publishedPosts,
  publishedProducts,
  publishedTrends,
  trendSummary,
} from "@/lib/api/serializers";

const nameIn = (list: MasterRow[], id: string) => list.find((x) => x.id === id)?.name ?? "";

export const { GET, POST, PUT, PATCH, DELETE } = route({
  GET: api(
    async ({ req }) => {
      const sp = req.nextUrl.searchParams;
      const v = new Validator();
      const q = v.str(sp.get("q"), "q", { max: 100, label: "キーワード" });
      const limit = v.intParam(sp.get("limit"), "limit", { min: 1, max: 50 }) ?? 20;
      v.check();
      const c = await loadCatalog();

      // スペースで区切った語をすべて含むもの（AND）
      const words = plain(q).split(/\s+/).filter(Boolean);
      const match = (...fields: (string | string[])[]) => {
        const text = plain(fields.flat().join(" "));
        return words.every((w) => text.includes(w));
      };
      const group = <T, R>(rows: T[], fields: (x: T) => (string | string[])[], toJson: (x: T) => R) => {
        const hit = rows.filter((x) => match(...fields(x)));
        return { items: hit.slice(0, limit).map(toJson), total: hit.length };
      };
      const shopName = (id: string) => c.shops.find((s) => s.id === id)?.name ?? "";

      return json({
        query: q,
        trends: group(publishedTrends(c), (t) => [t.name, t.subtitle, t.description, t.points, t.season], trendSummary),
        outfits: group(
          publishedOutfits(c),
          (o) => [o.title, o.description, nameIn(c.scenes, o.sceneId), o.tasteIds.map((id) => nameIn(c.tastes, id))],
          (o) => outfitSummary(c, o)
        ),
        products: group(
          publishedProducts(c),
          (p) => [p.name, nameIn(c.colors, p.colorId), nameIn(c.categories, p.categoryId), shopName(p.recommendedShopId)],
          (p) => productSummary(c, p)
        ),
        posts: group(publishedPosts(c), (p) => [p.title, p.excerpt, nameIn(c.postTags, p.tagId), p.paragraphs], postSummary),
        shops: group(
          c.shops.filter((s) => s.isPublished).sort(bySortOrder),
          (s) => [s.name, s.shopType],
          (s) => ({ id: s.id, name: s.name, url: s.url, shopType: s.shopType })
        ),
      });
    },
    { cache: "public" }
  ),
});
