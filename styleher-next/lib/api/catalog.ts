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
  hotScore: number;
  season: string;
  postCount: number;
  description: string;
  sortOrder: number;
  isPublished: boolean;
  images: string[];
  points: string[];
  tips: string[];
  ageIds: string[];
  tasteIds: string[];
  productIds: string[];
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

// ダミーの会員。認証サービスの代わりに、固定のトークンで本人を決める（lib/api/auth.ts）。
// DB の users には prisma/seed.ts で登録する
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

export async function loadCatalog(db: Db = prisma): Promise<Catalog> {
  const [masters, shops, products, trends, outfits, posts, heroSlides, communityImages] = await Promise.all([
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
  ]);

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
    trends: trends.map((t) => ({
      id: t.id,
      name: t.name,
      subtitle: t.subtitle,
      image: t.image,
      hotScore: t.hotScore,
      season: t.season,
      postCount: t.postCount,
      description: t.description,
      sortOrder: t.sortOrder,
      isPublished: t.isPublished,
      images: t.images.map((x) => x.image),
      points: t.points.map((x) => x.body),
      tips: t.tips.map((x) => x.body),
      ageIds: t.ages.map((x) => x.ageId),
      tasteIds: t.tastes.map((x) => x.tasteId),
      productIds: t.products.map((x) => x.productId),
      ...stamps(t),
    })),
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
