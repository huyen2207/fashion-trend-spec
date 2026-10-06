// ===== レスポンスの形を作る（docs/api.md 5.0） =====
// 公開APIは公開中のデータだけを使い、内部の値（検索キーワード・並び順・公開フラグなど）は返さない。
import { db, type ItemType, type OutfitRow, type PostRow, type ProductRow, type TrendRow } from "./store";

export const findPublished = {
  trend: (id: string) => db.trends.find((t) => t.id === id && t.isPublished),
  outfit: (id: string) => db.outfits.find((o) => o.id === id && o.isPublished),
  product: (id: string) => db.products.find((p) => p.id === id && p.isPublished),
  post: (id: string) => db.posts.find((p) => p.id === id && p.isPublished),
};
export const publishedTrends = () => db.trends.filter((t) => t.isPublished).sort(bySortOrder);
export const publishedOutfits = () => db.outfits.filter((o) => o.isPublished).sort(bySortOrder);
export const publishedProducts = () => db.products.filter((p) => p.isPublished).sort(bySortOrder);

// 並び順は一意に決める（同じ値ならIDの順。3.3）
export function bySortOrder(a: { sortOrder: number; id: string | number }, b: { sortOrder: number; id: string | number }) {
  return a.sortOrder - b.sortOrder || String(a.id).localeCompare(String(b.id));
}

// コーデのアイテム：写真の主役（main）＋サムネイル（item）
export const outfitProductIds = (o: OutfitRow) => (o.mainProductId ? [o.mainProductId, ...o.itemProductIds] : o.itemProductIds);
const productById = (id: string) => db.products.find((p) => p.id === id);

// 購入リンク：custom_url があればそれ、なければショップの検索URLの型に検索キーワードを入れる（docs/db.md 7.3）
export function purchaseLinks(p: ProductRow) {
  const shopOf = (id: string) => db.shops.find((s) => s.id === id);
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
export const outfitsWith = (productId: string) => publishedOutfits().filter((o) => outfitProductIds(o).includes(productId));

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

export function productSummary(p: ProductRow) {
  return {
    id: p.id,
    name: p.name,
    categoryId: p.categoryId,
    colorId: p.colorId,
    price: p.price,
    image: p.image,
    recommendedShopId: p.recommendedShopId,
    purchaseUrl: purchaseLinks(p)[0]?.url ?? "",
    wearCount: outfitsWith(p.id).length,
  };
}

export function outfitSummary(o: OutfitRow) {
  const items = o.itemProductIds.map(productById).filter((p): p is ProductRow => !!p);
  return {
    id: o.id,
    sceneId: o.sceneId,
    title: o.title,
    image: o.image,
    ageIds: o.ageIds,
    tasteIds: o.tasteIds,
    mainProductId: o.mainProductId,
    items: items.map((p) => ({ id: p.id, name: p.name, image: p.image, price: p.price })),
    totalPrice: outfitProductIds(o).reduce((sum, id) => sum + (productById(id)?.price ?? 0), 0),
  };
}

export function trendDetail(t: TrendRow) {
  return {
    ...trendSummary(t),
    description: t.description,
    images: t.images,
    points: t.points,
    tips: t.tips,
    products: t.productIds.map((id) => findPublished.product(id)).filter((p): p is ProductRow => !!p).map(productSummary),
    // おすすめコーデ：このトレンドのテイストを1つでも含むコーデを最大3件（今の画面と同じ決め方）
    relatedOutfits: publishedOutfits()
      .filter((o) => o.tasteIds.some((x) => t.tasteIds.includes(x)))
      .slice(0, 3)
      .map(outfitSummary),
  };
}

export function outfitDetail(o: OutfitRow) {
  return {
    ...outfitSummary(o),
    description: o.description,
    tips: o.tips,
    products: outfitProductIds(o)
      .map((id) => findPublished.product(id))
      .filter((p): p is ProductRow => !!p)
      .map((p) => ({ role: p.id === o.mainProductId ? "main" : "item", ...productSummary(p) })),
  };
}

export function productDetail(p: ProductRow) {
  return {
    ...productSummary(p),
    links: purchaseLinks(p),
    trends: publishedTrends()
      .filter((t) => t.productIds.includes(p.id))
      .map((t) => ({ id: t.id, name: t.name, image: t.image })),
    outfits: outfitsWith(p.id).map(outfitSummary),
  };
}

export function postSummary(p: PostRow) {
  return { id: p.id, title: p.title, tagId: p.tagId, publishedOn: p.publishedOn, image: p.image, excerpt: p.excerpt };
}
export const postDetail = (p: PostRow) => ({ ...postSummary(p), paragraphs: p.paragraphs });

// お気に入り・最近見たもの：種類に合わせた概要（非公開なら null）
export function itemSummary(type: ItemType, id: string) {
  if (type === "trend") {
    const t = findPublished.trend(id);
    return t ? trendSummary(t) : null;
  }
  if (type === "outfit") {
    const o = findPublished.outfit(id);
    return o ? outfitSummary(o) : null;
  }
  const p = findPublished.product(id);
  return p ? productSummary(p) : null;
}

// 検索用の正規化は画面と同じものを使う（全角/半角・大文字/小文字・カタカナ/ひらがなをそろえる）
export { plain } from "@/lib/utils";
