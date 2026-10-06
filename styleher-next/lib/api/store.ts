// ===== APIのダミーデータ（DBの代わり） =====
// docs/db.md のテーブルと同じ形のデータを、サーバーのメモリに持つ。
// 中身は lib/data.ts から作る。サーバーを再起動すると元に戻る（登録・変更は保存されない）。
import * as seed from "@/lib/data";

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
export type FavoriteRow = { id: number; userId: string; type: ItemType; itemId: string; createdAt: string };
export type RecentViewRow = { id: number; userId: string; type: ItemType; itemId: string; viewedAt: string };
export type StyleProfileRow = { userId: string; ageId: string; tasteIds: string[]; sceneId: string } & Timestamps;

export type NewsletterStatus = "pending" | "active" | "unsubscribed";
export type NewsletterSubscriptionRow = {
  id: number;
  email: string;
  status: NewsletterStatus;
  confirmedAt: string | null;
  unsubscribedAt: string | null;
} & Timestamps;

export type InquiryStatus = "new" | "in_progress" | "closed";
export type ContactInquiryRow = {
  id: number;
  userId: string | null;
  name: string;
  email: string;
  inquiryTypeId: string;
  message: string;
  status: InquiryStatus;
} & Timestamps;

export type AuditLogRow = {
  id: number;
  userId: string | null;
  tableName: string;
  action: "insert" | "update" | "delete";
  oldData: unknown;
  newData: unknown;
  createdAt: string;
};

export type Store = {
  scenes: SceneRow[];
  ages: MasterRow[];
  tastes: MasterRow[];
  categories: MasterRow[];
  colors: MasterRow[];
  postTags: MasterRow[];
  inquiryTypes: MasterRow[];
  shops: ShopRow[];
  products: ProductRow[];
  trends: TrendRow[];
  outfits: OutfitRow[];
  posts: PostRow[];
  heroSlides: HeroSlideRow[];
  communityImages: CommunityImageRow[];
  users: UserRow[];
  favorites: FavoriteRow[];
  recentViews: RecentViewRow[];
  styleProfiles: StyleProfileRow[];
  newsletterSubscriptions: NewsletterSubscriptionRow[];
  contactInquiries: ContactInquiryRow[];
  auditLogs: AuditLogRow[];
  // 二重送信の防止（Idempotency-Key）：キー → 前回の結果
  idempotency: Map<string, { status: number; body: unknown; expiresAt: number }>;
  nextId: Record<string, number>;
};

// ダミーの会員。認証サービスの代わりに、固定のトークンで本人を決める（lib/api/auth.ts）
export const DUMMY_MEMBER_ID = "00000000-0000-4000-8000-000000000001";
export const DUMMY_ADMIN_ID = "00000000-0000-4000-8000-000000000002";

// 現在の data.ts は色名・ショップ名・タグ名を直接持っているので、IDに置き換える（docs/db.md 付録B と同じ）
const COLOR_IDS: Record<string, string> = {
  白: "white", グレー: "gray", ベージュ: "beige", 黒: "black", 生成り: "kinari", キャメル: "camel",
  ブルー: "blue", 花柄: "floral", ピンク: "pink", ブラウン: "brown", ゴールド: "gold",
};
const SHOP_IDS: Record<string, string> = {
  UNIQLO: "uniqlo", GU: "gu", ZOZOTOWN: "zozotown", "Rakuten Fashion": "rakuten_fashion", しまむら: "shimamura",
  "UNITED ARROWS": "united_arrows", LUMINE: "lumine", 楽天市場: "rakuten", Amazon: "amazon",
};
const SEARCH_URL_TEMPLATES: Record<string, string> = {
  rakuten: "https://search.rakuten.co.jp/search/mall/{q}/",
  amazon: "https://www.amazon.co.jp/s?k={q}",
};
const POST_TAGS = [
  { id: "trend", name: "トレンド" },
  { id: "tsukin", name: "通勤" },
  { id: "kimawashi", name: "着回し" },
  { id: "kisetsu", name: "季節のコツ" },
];
const INQUIRY_TYPES = [
  { id: "content", name: "掲載内容について" },
  { id: "shop", name: "商品・ショップについて" },
  { id: "bug", name: "不具合のご報告" },
  { id: "business", name: "広告・取材・提携について" },
  { id: "other", name: "その他" },
];

function createStore(): Store {
  const now = new Date().toISOString();
  const ts = { createdAt: now, updatedAt: now };
  const master = (list: { id: string; name: string }[]): MasterRow[] =>
    list.map((x, i) => ({ id: x.id, name: x.name, sortOrder: i + 1, isPublished: true, ...ts }));
  const colors = [...new Set(seed.products.map((p) => p.color))].map((name) => ({ id: COLOR_IDS[name], name }));
  const tagIdOf = Object.fromEntries(POST_TAGS.map((t) => [t.name, t.id]));

  return {
    scenes: seed.scenes.map((s, i) => ({ id: s.id, name: s.name, icon: s.icon, sortOrder: i + 1, isPublished: true, ...ts })),
    ages: master(seed.ages),
    tastes: master(seed.tastes),
    // 画面用の「すべて（all）」はDBに持たない
    categories: master(seed.categories.filter((c) => c.id !== "all")),
    colors: master(colors),
    postTags: master(POST_TAGS),
    inquiryTypes: master(INQUIRY_TYPES),
    shops: seed.shops.map((s, i) => {
      const id = SHOP_IDS[s.name];
      return { id, name: s.name, url: s.url, shopType: s.type, searchUrlTemplate: SEARCH_URL_TEMPLATES[id] ?? null, sortOrder: i + 1, isPublished: true, ...ts };
    }),
    products: seed.products.map((p, i) => ({
      id: p.id,
      name: p.name,
      categoryId: p.cat,
      colorId: COLOR_IDS[p.color],
      price: p.price,
      recommendedShopId: SHOP_IDS[p.shop],
      image: p.img,
      searchKeyword: p.q,
      sortOrder: i + 1,
      isPublished: true,
      // URLは型から作れるので custom_url は空（docs/db.md 8.1）
      links: p.links.map((l) => ({ shopId: SHOP_IDS[l.shop], customUrl: null })),
      ...ts,
    })),
    trends: seed.trends.map((t, i) => ({
      id: t.id,
      name: t.name,
      subtitle: t.sub,
      image: t.img,
      hotScore: t.hot,
      season: t.season,
      postCount: t.posts,
      description: t.desc,
      sortOrder: i + 1,
      isPublished: true,
      images: [...t.gallery],
      points: [...t.points],
      tips: [...t.tips],
      ageIds: [...t.ages],
      tasteIds: [...t.tastes],
      productIds: [...t.products],
      ...ts,
    })),
    outfits: seed.outfits.map((o, i) => ({
      id: o.id,
      sceneId: o.scene,
      title: o.title,
      image: o.img,
      description: o.desc,
      sortOrder: i + 1,
      isPublished: true,
      mainProductId: o.main ?? null,
      itemProductIds: [...o.items],
      tips: [...o.tips],
      ageIds: [...o.ages],
      tasteIds: [...o.tastes],
      ...ts,
    })),
    posts: seed.posts.map((p) => ({
      id: p.id,
      title: p.title,
      tagId: tagIdOf[p.tag],
      publishedOn: p.date,
      image: p.img,
      excerpt: p.excerpt,
      isPublished: true,
      paragraphs: [...p.body],
      ...ts,
    })),
    heroSlides: seed.heroSlides.map((h, i) => ({
      id: i + 1,
      image: h.img,
      imagePosition: h.pos ?? "center 30%",
      title: h.title,
      body: h.text,
      sortOrder: i + 1,
      isPublished: true,
      ...ts,
    })),
    communityImages: seed.community.map((image, i) => ({ id: i + 1, image, sortOrder: i + 1, isPublished: true, ...ts })),
    users: [
      { id: DUMMY_MEMBER_ID, email: "hanako@example.com", role: "member", lastLoginAt: now, ...ts },
      { id: DUMMY_ADMIN_ID, email: "admin@example.com", role: "admin", lastLoginAt: now, ...ts },
    ],
    favorites: [],
    recentViews: [],
    styleProfiles: [],
    newsletterSubscriptions: [],
    contactInquiries: [],
    auditLogs: [],
    idempotency: new Map(),
    nextId: {
      heroSlides: seed.heroSlides.length + 1,
      communityImages: seed.community.length + 1,
      favorites: 1,
      recentViews: 1,
      newsletterSubscriptions: 1,
      contactInquiries: 1,
      auditLogs: 1,
    },
  };
}

// 開発中のホットリロードでデータが消えないよう、globalThis に1つだけ持つ
const g = globalThis as unknown as { __styleherStore?: Store };
export const db: Store = (g.__styleherStore ??= createStore());

export function nextId(table: keyof Store["nextId"]): number {
  return db.nextId[table]++;
}

export const nowIso = () => new Date().toISOString();
