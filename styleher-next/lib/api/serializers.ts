// ===== レスポンスの形を作る（docs/api.md 5.0） =====
// 公開APIは公開中のデータだけを使い、内部の値（検索キーワード・並び順・公開フラグなど）は返さない。
// どの関数も、DB から読み込んだデータ（lib/api/catalog.ts の Catalog）を受け取る。
import type { Catalog, ItemType, OutfitRow, PostRow, ProductRow, TrendRow } from "./catalog";

export const findPublished = {
  trend: (c: Catalog, id: string) => c.trends.find((t) => t.id === id && t.isPublished),
  outfit: (c: Catalog, id: string) => c.outfits.find((o) => o.id === id && o.isPublished),
  product: (c: Catalog, id: string) => c.products.find((p) => p.id === id && p.isPublished),
  post: (c: Catalog, id: string) => c.posts.find((p) => p.id === id && p.isPublished),
};
export const publishedTrends = (c: Catalog) => c.trends.filter((t) => t.isPublished).sort(bySortOrder);
export const publishedOutfits = (c: Catalog) => c.outfits.filter((o) => o.isPublished).sort(bySortOrder);
export const publishedProducts = (c: Catalog) => c.products.filter((p) => p.isPublished).sort(bySortOrder);
// 公開日の新しい順。同じ日はIDの順
export const publishedPosts = (c: Catalog) =>
  c.posts.filter((p) => p.isPublished).sort((a, b) => b.publishedOn.localeCompare(a.publishedOn) || a.id.localeCompare(b.id));

// 並び順は一意に決める（同じ値ならIDの順。3.3）
export function bySortOrder(a: { sortOrder: number; id: string | number }, b: { sortOrder: number; id: string | number }) {
  return a.sortOrder - b.sortOrder || String(a.id).localeCompare(String(b.id));
}

// コーデのアイテム：写真の主役（main）＋サムネイル（item）
export const outfitProductIds = (o: OutfitRow) => (o.mainProductId ? [o.mainProductId, ...o.itemProductIds] : o.itemProductIds);
const productById = (c: Catalog, id: string) => c.products.find((p) => p.id === id);

// 購入リンク：custom_url があればそれ、なければショップの検索URLの型に検索キーワードを入れる（docs/db.md 7.3）
export function purchaseLinks(c: Catalog, p: ProductRow) {
  const shopOf = (id: string) => c.shops.find((s) => s.id === id);
  return [...p.links]
    .sort((a, b) => {
      if (a.shopId === p.recommendedShopId) return -1;
      if (b.shopId === p.recommendedShopId) return 1;
      return (shopOf(a.shopId)?.sortOrder ?? 0) - (shopOf(b.shopId)?.sortOrder ?? 0);
    })
    .map((l) => {
      const shop = shopOf(l.shopId);
      const url = l.customUrl ?? shop?.searchUrlTemplate?.replace("{q}", encodeURIComponent(p.searchKeyword)) ?? "";
      return { shopId: l.shopId, shopName: shop?.name ?? l.shopId, url };
    });
}

// 着回し数：そのアイテムを使った公開中のコーデ
export const outfitsWith = (c: Catalog, productId: string) =>
  publishedOutfits(c).filter((o) => outfitProductIds(o).includes(productId));

export function trendSummary(t: TrendRow) {
  return {
    id: t.id,
    name: t.name,
    subtitle: t.subtitle,
    image: t.image,
    hotScore: t.hotScore,
    season: t.season,
    postCount: t.postCount,
    ageIds: t.ageIds,
    tasteIds: t.tasteIds,
  };
}

export function productSummary(c: Catalog, p: ProductRow) {
  return {
    id: p.id,
    name: p.name,
    categoryId: p.categoryId,
    colorId: p.colorId,
    price: p.price,
    image: p.image,
    recommendedShopId: p.recommendedShopId,
    purchaseUrl: purchaseLinks(c, p)[0]?.url ?? "",
    wearCount: outfitsWith(c, p.id).length,
  };
}

export function outfitSummary(c: Catalog, o: OutfitRow) {
  const items = o.itemProductIds.map((id) => productById(c, id)).filter((p): p is ProductRow => !!p);
  return {
    id: o.id,
    sceneId: o.sceneId,
    title: o.title,
    image: o.image,
    ageIds: o.ageIds,
    tasteIds: o.tasteIds,
    mainProductId: o.mainProductId,
    items: items.map((p) => ({ id: p.id, name: p.name, image: p.image, price: p.price })),
    totalPrice: outfitProductIds(o).reduce((sum, id) => sum + (productById(c, id)?.price ?? 0), 0),
  };
}

export function trendDetail(c: Catalog, t: TrendRow) {
  return {
    ...trendSummary(t),
    description: t.description,
    images: t.images,
    points: t.points,
    tips: t.tips,
    products: t.productIds
      .map((id) => findPublished.product(c, id))
      .filter((p): p is ProductRow => !!p)
      .map((p) => productSummary(c, p)),
    // おすすめコーデ：このトレンドのテイストを1つでも含むコーデを最大3件（今の画面と同じ決め方）
    relatedOutfits: publishedOutfits(c)
      .filter((o) => o.tasteIds.some((x) => t.tasteIds.includes(x)))
      .slice(0, 3)
      .map((o) => outfitSummary(c, o)),
  };
}

export function outfitDetail(c: Catalog, o: OutfitRow) {
  return {
    ...outfitSummary(c, o),
    description: o.description,
    tips: o.tips,
    products: outfitProductIds(o)
      .map((id) => findPublished.product(c, id))
      .filter((p): p is ProductRow => !!p)
      .map((p) => ({ role: p.id === o.mainProductId ? "main" : "item", ...productSummary(c, p) })),
  };
}

export function productDetail(c: Catalog, p: ProductRow) {
  return {
    ...productSummary(c, p),
    links: purchaseLinks(c, p),
    trends: publishedTrends(c)
      .filter((t) => t.productIds.includes(p.id))
      .map((t) => ({ id: t.id, name: t.name, image: t.image })),
    outfits: outfitsWith(c, p.id).map((o) => outfitSummary(c, o)),
  };
}

export function postSummary(p: PostRow) {
  return { id: p.id, title: p.title, tagId: p.tagId, publishedOn: p.publishedOn, image: p.image, excerpt: p.excerpt };
}

// お気に入り・最近見たもの：種類に合わせた概要（非公開なら null）
export function itemSummary(c: Catalog, type: ItemType, id: string) {
  if (type === "trend") {
    const t = findPublished.trend(c, id);
    return t ? trendSummary(t) : null;
  }
  if (type === "outfit") {
    const o = findPublished.outfit(c, id);
    return o ? outfitSummary(c, o) : null;
  }
  const p = findPublished.product(c, id);
  return p ? productSummary(c, p) : null;
}

// 検索用の正規化は画面と同じものを使う（全角/半角・大文字/小文字・カタカナ/ひらがなをそろえる）
export { plain } from "@/lib/utils";
