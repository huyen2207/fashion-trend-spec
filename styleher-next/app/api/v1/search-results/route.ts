// A-14 キーワード検索（docs/api.md 5.14。画面の検索と同じ項目・同じ表記ゆれの扱い）
import { api, json, route, Validator } from "@/lib/api/http";
import { bySortOrder, outfitSummary, plain, postSummary, productSummary, publishedOutfits, publishedProducts, publishedTrends, trendSummary } from "@/lib/api/serializers";
import { db, type MasterRow } from "@/lib/api/store";

const nameIn = (list: MasterRow[], id: string) => list.find((x) => x.id === id)?.name ?? "";

export const { GET, POST, PUT, PATCH, DELETE } = route({
  GET: api(
    ({ req }) => {
      const sp = req.nextUrl.searchParams;
      const v = new Validator();
      const q = v.str(sp.get("q"), "q", { max: 100, label: "キーワード" });
      const limit = v.intParam(sp.get("limit"), "limit", { min: 1, max: 50 }) ?? 20;
      v.check();

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
      const shopName = (id: string) => db.shops.find((s) => s.id === id)?.name ?? "";

      return json({
        query: q,
        trends: group(publishedTrends(), (t) => [t.name, t.subtitle, t.description, t.points, t.season], trendSummary),
        outfits: group(
          publishedOutfits(),
          (o) => [o.title, o.description, nameIn(db.scenes, o.sceneId), o.tasteIds.map((id) => nameIn(db.tastes, id))],
          outfitSummary
        ),
        products: group(
          publishedProducts(),
          (p) => [p.name, nameIn(db.colors, p.colorId), nameIn(db.categories, p.categoryId), shopName(p.recommendedShopId)],
          productSummary
        ),
        posts: group(
          db.posts.filter((p) => p.isPublished).sort((a, b) => b.publishedOn.localeCompare(a.publishedOn)),
          (p) => [p.title, p.excerpt, nameIn(db.postTags, p.tagId), p.paragraphs],
          postSummary
        ),
        shops: group(
          db.shops.filter((s) => s.isPublished).sort(bySortOrder),
          (s) => [s.name, s.shopType],
          (s) => ({ id: s.id, name: s.name, url: s.url, shopType: s.shopType })
        ),
      });
    },
    { cache: "public" }
  ),
});
