// ===== DB（Neon）から読み込んだデータの形 =====
// マスタ・コンテンツは件数が少ない（数十〜数百件）ため、リクエストごとにまとめて読み込み、
// 子テーブル（ポイント・対象年代など）を配列にした形（〜Row）で扱う（docs/db.md 11章「キーワード検索」と同じ考え方）。
// 公開・非公開の両方を読み込み、公開APIでは serializers.ts で公開中のものだけを使う。
import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";

type Timestamps = { createdAt: string; updatedAt: string };

export type MasterRow = { id: string; name: string; sortOrder: number; isPublished: boolean } & Timestamps;
export type SceneRow = MasterRow & { icon: string };

export type ShopRow = {
  id: string;
  name: string;
  url: string;
  shopType: string;
  searchUrlTemplate: string | null;
  sortOrder: number;
  isPublished: boolean;
} & Timestamps;

export type ProductLink = { shopId: string; customUrl: string | null };
export type ProductRow = {
  id: string;
  name: string;
  categoryId: string;
  colorId: string;
  price: number;
  recommendedShopId: string;
  image: string;
  searchKeyword: string;
  sortOrder: number;
  isPublished: boolean;
  links: ProductLink[];
} & Timestamps;

export type TrendRow = {
  id: string;
  name: string;
  subtitle: string;
  image: string;
  // 運営者が決める注目度の基準値（0〜100）。画面に出すのは、反応を足して計算した liveHotScore
  hotScore: number;
  season: string;
  description: string;
  sortOrder: number;
  isPublished: boolean;
  images: string[];
  points: string[];
  tips: string[];
  ageIds: string[];
  tasteIds: string[];
  productIds: string[];
  // このトレンドのコーデ（ルックブック）
  outfitIds: string[];
  // 以下は DB の値から計算する（読み取り専用）
  // 公開中のコーデの件数（カードの「◯件のコーデ」）
  postCount: number;
  // 直近7日の反応（詳細を開いた回数・お気に入りの数）
  recent: { views: number; favorites: number };
  // 画面に出す注目度（0〜100。docs/db.md 7.1）
  liveHotScore: number;
} & Timestamps;

export type OutfitRow = {
  id: string;
  sceneId: string;
  title: string;
  image: string;
  description: string;
  sortOrder: number;
  isPublished: boolean;
  mainProductId: string | null;
  itemProductIds: string[];
  tips: string[];
  ageIds: string[];
  tasteIds: string[];
} & Timestamps;

export type PostRow = {
  id: string;
  title: string;
  tagId: string;
  publishedOn: string;
  image: string;
  excerpt: string;
  isPublished: boolean;
  paragraphs: string[];
} & Timestamps;

export type HeroSlideRow = {
  id: number;
  image: string;
  imagePosition: string;
  title: string;
  body: string;
  sortOrder: number;
  isPublished: boolean;
} & Timestamps;

export type CommunityImageRow = { id: number; image: string; sortOrder: number; isPublished: boolean } & Timestamps;

export type UserRow = { id: string; email: string; role: "member" | "admin"; lastLoginAt: string | null } & Timestamps;

// お気に入り・最近見たものの対象の種類
export type ItemType = "trend" | "outfit" | "product";

export type NewsletterStatus = "pending" | "active" | "unsubscribed";
export type InquiryStatus = "new" | "in_progress" | "closed";

export type Masters = {
  scenes: SceneRow[];
  ages: MasterRow[];
  tastes: MasterRow[];
  categories: MasterRow[];
  colors: MasterRow[];
  postTags: MasterRow[];
  inquiryTypes: MasterRow[];
};

export type Catalog = Masters & {
  shops: ShopRow[];
  products: ProductRow[];
  trends: TrendRow[];
  outfits: OutfitRow[];
  posts: PostRow[];
  heroSlides: HeroSlideRow[];
  communityImages: CommunityImageRow[];
};

// 開発用の会員（一般会員・管理者）。DB の users に prisma/seed.ts で、ログイン用のパスワードと一緒に登録する
export const DUMMY_MEMBER_ID = "00000000-0000-4000-8000-000000000001";
export const DUMMY_ADMIN_ID = "00000000-0000-4000-8000-000000000002";

export const nowIso = () => new Date().toISOString();
export const iso = (d: Date) => d.toISOString();
const isoOrNull = (d: Date | null) => (d ? d.toISOString() : null);
// date 型（公開日）は YYYY-MM-DD
const dateOnly = (d: Date) => d.toISOString().slice(0, 10);

// トランザクションの中でも外でも使えるように、Prisma Client かトランザクションを受け取る
export type Db = Prisma.TransactionClient;

const bySort = { sortOrder: "asc" } as const;
const byOrder = [{ sortOrder: "asc" }, { id: "asc" }] as const;
const stamps = (r: { createdAt: Date; updatedAt: Date }) => ({ createdAt: iso(r.createdAt), updatedAt: iso(r.updatedAt) });

type MasterRecord = { id: string; name: string; sortOrder: number; isPublished: boolean; createdAt: Date; updatedAt: Date };
const toMaster = (r: MasterRecord): MasterRow => ({ id: r.id, name: r.name, sortOrder: r.sortOrder, isPublished: r.isPublished, ...stamps(r) });

export async function loadMasters(db: Db = prisma): Promise<Masters> {
  const [scenes, ages, tastes, categories, colors, postTags, inquiryTypes] = await Promise.all([
    db.scene.findMany({ orderBy: [...byOrder] }),
    db.age.findMany({ orderBy: [...byOrder] }),
    db.taste.findMany({ orderBy: [...byOrder] }),
    db.category.findMany({ orderBy: [...byOrder] }),
    db.color.findMany({ orderBy: [...byOrder] }),
    db.postTag.findMany({ orderBy: [...byOrder] }),
    db.inquiryType.findMany({ orderBy: [...byOrder] }),
  ]);
  return {
    scenes: scenes.map((s) => ({ ...toMaster(s), icon: s.icon })),
    ages: ages.map(toMaster),
    tastes: tastes.map(toMaster),
    categories: categories.map(toMaster),
    colors: colors.map(toMaster),
    postTags: postTags.map(toMaster),
    inquiryTypes: inquiryTypes.map(toMaster),
  };
}

// ---- 注目度（docs/db.md 7.1） ----
// 直近7日（日本時間・今日を含む）の反応から計算する。反応の点数 ＝ 詳細を開いた回数 ＋ お気に入りの数 × 3。
// 反応が少ないうちに数字が大きくぶれないよう、運営者が決めた hot_score を「30点分の反応」として足しておく。
// 公開中のトレンドのうち、いちばん点数の高いものを 100% にする
export const HOT_WINDOW_DAYS = 7;
const FAVORITE_WEIGHT = 3;
const BASE_POINTS = 30;

// 日本時間の今日（date 型の列に入れる値。UTC の0時にする）
export function todayJst(now = new Date()) {
  return new Date(`${new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)}T00:00:00Z`);
}

function withLiveHotScores(trends: TrendRow[]): TrendRow[] {
  const points = (t: TrendRow) => (t.hotScore / 100) * BASE_POINTS + t.recent.views + Math.max(t.recent.favorites, 0) * FAVORITE_WEIGHT;
  const max = Math.max(...trends.filter((t) => t.isPublished).map(points), 0);
  return trends.map((t) => ({ ...t, liveHotScore: max > 0 ? Math.min(Math.round((points(t) / max) * 100), 100) : 0 }));
}

export async function loadCatalog(db: Db = prisma): Promise<Catalog> {
  const since = new Date(todayJst().getTime() - (HOT_WINDOW_DAYS - 1) * 24 * 60 * 60 * 1000);
  const [masters, shops, products, trends, outfits, posts, heroSlides, communityImages, trendStats] = await Promise.all([
    loadMasters(db),
    db.shop.findMany({ orderBy: [...byOrder] }),
    db.product.findMany({
      orderBy: [...byOrder],
      include: { links: { orderBy: [{ shop: { sortOrder: "asc" } }, { shopId: "asc" }] } },
    }),
    db.trend.findMany({
      orderBy: [...byOrder],
      include: {
        images: { orderBy: bySort },
        points: { orderBy: bySort },
        tips: { orderBy: bySort },
        // 中間テーブルは並び順を持たないので、マスタの並び順にする
        ages: { orderBy: { age: { sortOrder: "asc" } } },
        tastes: { orderBy: { taste: { sortOrder: "asc" } } },
        products: { orderBy: [{ sortOrder: "asc" }, { productId: "asc" }] },
        outfits: { orderBy: [{ sortOrder: "asc" }, { outfitId: "asc" }] },
      },
    }),
    db.outfit.findMany({
      orderBy: [...byOrder],
      include: {
        products: { orderBy: [{ sortOrder: "asc" }, { productId: "asc" }] },
        tips: { orderBy: bySort },
        ages: { orderBy: { age: { sortOrder: "asc" } } },
        tastes: { orderBy: { taste: { sortOrder: "asc" } } },
      },
    }),
    db.post.findMany({ orderBy: [{ publishedOn: "desc" }, { id: "asc" }], include: { paragraphs: { orderBy: bySort } } }),
    db.heroSlide.findMany({ orderBy: [...byOrder] }),
    db.communityImage.findMany({ orderBy: [...byOrder] }),
    db.trendDailyStat.groupBy({ by: ["trendId"], where: { statDate: { gte: since } }, _sum: { viewCount: true, favoriteCount: true } }),
  ]);
  const publishedOutfitIds = new Set(outfits.filter((o) => o.isPublished).map((o) => o.id));
  const statsOf = (trendId: string) => trendStats.find((x) => x.trendId === trendId)?._sum;

  return {
    ...masters,
    shops: shops.map((s) => ({
      id: s.id,
      name: s.name,
      url: s.url,
      shopType: s.shopType,
      searchUrlTemplate: s.searchUrlTemplate,
      sortOrder: s.sortOrder,
      isPublished: s.isPublished,
      ...stamps(s),
    })),
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      categoryId: p.categoryId,
      colorId: p.colorId,
      price: p.price,
      recommendedShopId: p.recommendedShopId,
      image: p.image,
      searchKeyword: p.searchKeyword,
      sortOrder: p.sortOrder,
      isPublished: p.isPublished,
      // おすすめのショップを先頭に（docs/db.md 7.3）
      links: [...p.links]
        .sort((a, b) => Number(b.shopId === p.recommendedShopId) - Number(a.shopId === p.recommendedShopId))
        .map((l) => ({ shopId: l.shopId, customUrl: l.customUrl })),
      ...stamps(p),
    })),
    trends: withLiveHotScores(
      trends.map((t) => ({
        id: t.id,
        name: t.name,
        subtitle: t.subtitle,
        image: t.image,
        hotScore: t.hotScore,
        season: t.season,
        description: t.description,
        sortOrder: t.sortOrder,
        isPublished: t.isPublished,
        images: t.images.map((x) => x.image),
        points: t.points.map((x) => x.body),
        tips: t.tips.map((x) => x.body),
        ageIds: t.ages.map((x) => x.ageId),
        tasteIds: t.tastes.map((x) => x.tasteId),
        productIds: t.products.map((x) => x.productId),
        outfitIds: t.outfits.map((x) => x.outfitId),
        postCount: t.outfits.filter((x) => publishedOutfitIds.has(x.outfitId)).length,
        recent: { views: statsOf(t.id)?.viewCount ?? 0, favorites: statsOf(t.id)?.favoriteCount ?? 0 },
        liveHotScore: 0,
        ...stamps(t),
      }))
    ),
    outfits: outfits.map((o) => ({
      id: o.id,
      sceneId: o.sceneId,
      title: o.title,
      image: o.image,
      description: o.description,
      sortOrder: o.sortOrder,
      isPublished: o.isPublished,
      mainProductId: o.products.find((x) => x.role === "main")?.productId ?? null,
      itemProductIds: o.products.filter((x) => x.role === "item").map((x) => x.productId),
      tips: o.tips.map((x) => x.body),
      ageIds: o.ages.map((x) => x.ageId),
      tasteIds: o.tastes.map((x) => x.tasteId),
      ...stamps(o),
    })),
    posts: posts.map((p) => ({
      id: p.id,
      title: p.title,
      tagId: p.tagId,
      publishedOn: dateOnly(p.publishedOn),
      image: p.image,
      excerpt: p.excerpt,
      isPublished: p.isPublished,
      paragraphs: p.paragraphs.map((x) => x.body),
      ...stamps(p),
    })),
    heroSlides: heroSlides.map((h) => ({
      id: h.id,
      image: h.image,
      imagePosition: h.imagePosition,
      title: h.title,
      body: h.body,
      sortOrder: h.sortOrder,
      isPublished: h.isPublished,
      ...stamps(h),
    })),
    communityImages: communityImages.map((c) => ({ id: c.id, image: c.image, sortOrder: c.sortOrder, isPublished: c.isPublished, ...stamps(c) })),
  };
}

export function toUserRow(u: { id: string; email: string; role: string; lastLoginAt: Date | null; createdAt: Date; updatedAt: Date }): UserRow {
  return { id: u.id, email: u.email, role: u.role as UserRow["role"], lastLoginAt: isoOrNull(u.lastLoginAt), ...stamps(u) };
}

// 受付・変更履歴の行（連番の id は bigint なので、JSON にできる number にする）
export function toContactInquiryJson(r: Prisma.ContactInquiryGetPayload<object>) {
  return {
    id: Number(r.id),
    userId: r.userId,
    name: r.name,
    email: r.email,
    inquiryTypeId: r.inquiryTypeId,
    message: r.message,
    status: r.status as InquiryStatus,
    ...stamps(r),
  };
}

export function toNewsletterJson(r: Prisma.NewsletterSubscriptionGetPayload<object>) {
  return {
    id: Number(r.id),
    email: r.email,
    status: r.status as NewsletterStatus,
    confirmedAt: isoOrNull(r.confirmedAt),
    unsubscribedAt: isoOrNull(r.unsubscribedAt),
    ...stamps(r),
  };
}

export function toAuditLogJson(r: Prisma.AuditLogGetPayload<object>) {
  return {
    id: Number(r.id),
    userId: r.userId,
    tableName: r.tableName,
    action: r.action as "insert" | "update" | "delete",
    oldData: r.oldData,
    newData: r.newData,
    createdAt: iso(r.createdAt),
  };
}

// 連番の id（パスの値）。数字でなければ null（存在しないのと同じ扱いにする）
export const bigIntId = (raw: string) => (/^\d{1,18}$/.test(raw) ? BigInt(raw) : null);
