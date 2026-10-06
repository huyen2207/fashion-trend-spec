// ===== 管理API のリソース定義（docs/api.md 4.4・8章） =====
// /admin/{resource} で扱う14種類のリソースについて、入力チェックと保存のしかたを決める。
// 削除のAPIはない（削除の代わりに非公開にする）。
import { Validator } from "./http";
import { bySortOrder, outfitProductIds } from "./serializers";
import { db, nextId, nowIso, type MasterRow, type Store } from "./store";

export type Row = Record<string, unknown> & { id: string | number; isPublished: boolean; createdAt: string; updatedAt: string };
type Body = Record<string, unknown>;

export type ResourceDef = {
  table: string; // 変更履歴に記録するテーブル名（DBのテーブル名）
  rows: () => Row[];
  autoId?: "heroSlides" | "communityImages"; // 自動採番のリソース
  order: (a: Row, b: Row) => number;
  searchText: (r: Row) => string; // 一覧の q（名前・タイトルの部分一致）
  parse: (body: Body, v: Validator, currentId?: string | number) => Record<string, unknown>; // POST・PUT の全項目
  hasSortOrder: boolean;
};

const asRows = (list: unknown[]) => () => list as Row[];
const byOrder = (a: Row, b: Row) => bySortOrder({ sortOrder: Number(a.sortOrder), id: a.id }, { sortOrder: Number(b.sortOrder), id: b.id });
const has = <T extends { id: string }>(list: T[]) => (id: string) => list.some((x) => x.id === id);
const sortOrderOf = (v: Validator, body: Body) => v.int(body.sortOrder, "sortOrder", "並び順", { min: -32768, max: 32767 });

// 名前の重複チェック（自分以外に同じ名前がないか）
function uniqueName(v: Validator, list: { id: string; name: string }[], name: string, currentId?: string | number) {
  if (name && list.some((x) => x.name === name && x.id !== currentId)) v.add("name", `「${name}」はすでに使われています。`);
}

// ---- マスタ（7種類） ----
function masterDef(table: string, key: keyof Pick<Store, "scenes" | "ages" | "tastes" | "categories" | "colors" | "postTags" | "inquiryTypes">, nameMax = 30): ResourceDef {
  return {
    table,
    rows: () => db[key] as unknown as Row[],
    order: byOrder,
    hasSortOrder: true,
    searchText: (r) => String(r.name),
    parse: (b, v, currentId) => {
      const name = v.str(b.name, "name", { max: nameMax, label: "名前" });
      uniqueName(v, db[key] as MasterRow[], name, currentId);
      const data: Record<string, unknown> = { name, sortOrder: sortOrderOf(v, b), isPublished: v.bool(b.isPublished, "isPublished", "公開") };
      if (key === "scenes") {
        const icons = ["briefcase", "bag", "heart", "sparkle", "plane", "home"];
        if (!icons.includes(b.icon as string)) v.add("icon", `アイコンは ${icons.join(" / ")} のいずれかにしてください。`);
        data.icon = b.icon;
      }
      return data;
    },
  };
}

export const RESOURCES: Record<string, ResourceDef> = {
  scenes: masterDef("scenes", "scenes"),
  ages: masterDef("ages", "ages"),
  tastes: masterDef("tastes", "tastes"),
  categories: masterDef("categories", "categories"),
  colors: masterDef("colors", "colors"),
  "post-tags": masterDef("post_tags", "postTags"),
  "inquiry-types": masterDef("inquiry_types", "inquiryTypes", 50),

  shops: {
    table: "shops",
    rows: asRows(db.shops),
    order: byOrder,
    hasSortOrder: true,
    searchText: (r) => String(r.name),
    parse: (b, v, currentId) => {
      const name = v.str(b.name, "name", { max: 50, label: "ショップ名" });
      uniqueName(v, db.shops, name, currentId);
      let searchUrlTemplate: string | null = null;
      if (b.searchUrlTemplate !== null && b.searchUrlTemplate !== undefined) {
        searchUrlTemplate = v.url(b.searchUrlTemplate, "searchUrlTemplate", "検索URLの型");
        if (searchUrlTemplate && !searchUrlTemplate.includes("{q}")) v.add("searchUrlTemplate", "検索URLの型には {q} を入れてください。");
      }
      return {
        name,
        url: v.url(b.url, "url", "公式サイトURL"),
        shopType: v.str(b.shopType, "shopType", { max: 30, label: "種類" }),
        searchUrlTemplate,
        sortOrder: sortOrderOf(v, b),
        isPublished: v.bool(b.isPublished, "isPublished", "公開"),
      };
    },
  },

  products: {
    table: "products",
    rows: asRows(db.products),
    order: byOrder,
    hasSortOrder: true,
    searchText: (r) => String(r.name),
    parse: (b, v) => {
      const recommendedShopId = v.ref(b.recommendedShopId, "recommendedShopId", "おすすめのショップ", has(db.shops));
      const links: { shopId: string; customUrl: string | null }[] = [];
      if (!Array.isArray(b.links) || !b.links.length) v.add("links", "購入リンクを1件以上入れてください。");
      else
        b.links.forEach((l: unknown, i) => {
          const link = (l ?? {}) as Body;
          const shopId = v.ref(link.shopId, `links[${i}].shopId`, "ショップ", has(db.shops));
          const customUrl = link.customUrl === null || link.customUrl === undefined ? null : v.url(link.customUrl, `links[${i}].customUrl`, "個別のURL", 1000);
          // 検索URLの型を持たないショップには、個別のURLが必要
          if (shopId && !customUrl && !db.shops.find((s) => s.id === shopId)?.searchUrlTemplate)
            v.add(`links[${i}].customUrl`, "このショップには検索URLの型がないため、個別のURLを入れてください。");
          if (links.some((x) => x.shopId === shopId)) v.add(`links[${i}].shopId`, "同じショップが2回入っています。");
          links.push({ shopId, customUrl });
        });
      // おすすめのショップの購入リンクが必ずあること（DBでは fk_products_recommended_link で守る）
      if (recommendedShopId && links.length && !links.some((l) => l.shopId === recommendedShopId))
        v.add("links", "おすすめのショップの購入リンクを入れてください。");
      return {
        name: v.str(b.name, "name", { max: 100, label: "アイテム名" }),
        categoryId: v.ref(b.categoryId, "categoryId", "カテゴリー", has(db.categories)),
        colorId: v.ref(b.colorId, "colorId", "カラー", has(db.colors)),
        price: v.int(b.price, "price", "参考価格", { min: 0, max: 10_000_000 }),
        recommendedShopId,
        image: v.str(b.image, "image", { max: 255, label: "画像" }),
        searchKeyword: v.str(b.searchKeyword, "searchKeyword", { max: 100, label: "検索キーワード" }),
        sortOrder: sortOrderOf(v, b),
        isPublished: v.bool(b.isPublished, "isPublished", "公開"),
        links,
      };
    },
  },

  trends: {
    table: "trends",
    rows: asRows(db.trends),
    order: byOrder,
    hasSortOrder: true,
    searchText: (r) => String(r.name),
    parse: (b, v) => ({
      name: v.str(b.name, "name", { max: 50, label: "トレンド名" }),
      subtitle: v.str(b.subtitle, "subtitle", { max: 100, label: "サブタイトル" }),
      image: v.str(b.image, "image", { max: 255, label: "メイン画像" }),
      hotScore: v.int(b.hotScore, "hotScore", "注目度", { min: 0, max: 100 }),
      season: v.str(b.season, "season", { max: 30, label: "旬の時期" }),
      postCount: v.int(b.postCount, "postCount", "コーデ件数", { min: 0, max: 1_000_000 }),
      description: v.str(b.description, "description", { max: 5000, label: "説明" }),
      sortOrder: sortOrderOf(v, b),
      isPublished: v.bool(b.isPublished, "isPublished", "公開"),
      images: v.strList(b.images, "images", "追加画像", 255),
      points: v.strList(b.points, "points", "ポイント", 200),
      tips: v.strList(b.tips, "tips", "コツ", 200),
      ageIds: v.refList(b.ageIds, "ageIds", "年代", has(db.ages)),
      tasteIds: v.refList(b.tasteIds, "tasteIds", "テイスト", has(db.tastes)),
      productIds: v.refList(b.productIds, "productIds", "アイテム", has(db.products)),
    }),
  },

  outfits: {
    table: "outfits",
    rows: asRows(db.outfits),
    order: byOrder,
    hasSortOrder: true,
    searchText: (r) => String(r.title),
    parse: (b, v) => {
      const mainProductId =
        b.mainProductId === null || b.mainProductId === undefined ? null : v.ref(b.mainProductId, "mainProductId", "主役アイテム", has(db.products));
      const itemProductIds = v.refList(b.itemProductIds, "itemProductIds", "アイテム", has(db.products));
      if (mainProductId && itemProductIds.includes(mainProductId)) v.add("mainProductId", "主役アイテムはサムネイルのアイテムと別にしてください。");
      return {
        sceneId: v.ref(b.sceneId, "sceneId", "シーン", has(db.scenes)),
        title: v.str(b.title, "title", { max: 100, label: "タイトル" }),
        image: v.str(b.image, "image", { max: 255, label: "コーデ画像" }),
        description: v.str(b.description, "description", { max: 5000, label: "説明" }),
        sortOrder: sortOrderOf(v, b),
        isPublished: v.bool(b.isPublished, "isPublished", "公開"),
        mainProductId,
        itemProductIds,
        tips: v.strList(b.tips, "tips", "コツ", 200),
        ageIds: v.refList(b.ageIds, "ageIds", "年代", has(db.ages)),
        tasteIds: v.refList(b.tasteIds, "tasteIds", "テイスト", has(db.tastes)),
      };
    },
  },

  posts: {
    table: "posts",
    rows: asRows(db.posts),
    // 公開日の新しい順
    order: (a, b) => String(b.publishedOn).localeCompare(String(a.publishedOn)) || String(a.id).localeCompare(String(b.id)),
    hasSortOrder: false,
    searchText: (r) => String(r.title),
    parse: (b, v) => {
      const publishedOn = typeof b.publishedOn === "string" ? b.publishedOn : "";
      if (!/^\d{4}-\d{2}-\d{2}$/.test(publishedOn) || Number.isNaN(Date.parse(publishedOn))) v.add("publishedOn", "公開日は YYYY-MM-DD で指定してください。");
      return {
        title: v.str(b.title, "title", { max: 100, label: "タイトル" }),
        tagId: v.ref(b.tagId, "tagId", "タグ", has(db.postTags)),
        publishedOn,
        image: v.str(b.image, "image", { max: 255, label: "画像" }),
        excerpt: v.str(b.excerpt, "excerpt", { max: 200, label: "概要" }),
        isPublished: v.bool(b.isPublished, "isPublished", "公開"),
        paragraphs: v.strList(b.paragraphs, "paragraphs", "本文の段落", 10000),
      };
    },
  },

  "hero-slides": {
    table: "hero_slides",
    rows: asRows(db.heroSlides),
    autoId: "heroSlides",
    order: byOrder,
    hasSortOrder: true,
    searchText: (r) => String(r.title),
    parse: (b, v) => ({
      image: v.str(b.image, "image", { max: 255, label: "画像" }),
      imagePosition: v.str(b.imagePosition, "imagePosition", { max: 30, label: "画像の表示位置" }),
      title: v.str(b.title, "title", { max: 100, label: "見出し" }),
      body: v.str(b.body, "body", { max: 200, label: "本文" }),
      sortOrder: sortOrderOf(v, b),
      isPublished: v.bool(b.isPublished, "isPublished", "公開"),
    }),
  },

  "community-images": {
    table: "community_images",
    rows: asRows(db.communityImages),
    autoId: "communityImages",
    order: byOrder,
    hasSortOrder: true,
    searchText: (r) => String(r.image),
    parse: (b, v) => ({
      image: v.str(b.image, "image", { max: 255, label: "画像" }),
      sortOrder: sortOrderOf(v, b),
      isPublished: v.bool(b.isPublished, "isPublished", "公開"),
    }),
  },
};

export function findRow(def: ResourceDef, id: string): Row | undefined {
  return def.rows().find((r) => String(r.id) === id);
}

export function createRow(def: ResourceDef, id: string | number, data: Record<string, unknown>): Row {
  const now = nowIso();
  const row = { id, ...data, createdAt: now, updatedAt: now } as Row;
  def.rows().push(row);
  return row;
}
export const newAutoId = (def: ResourceDef) => nextId(def.autoId!);

// 更新日時は必ず前より新しくする（同じミリ秒に2回更新しても ETag が変わるように）
export function touch(row: { updatedAt: string }) {
  const now = Date.now();
  const prev = Date.parse(row.updatedAt);
  row.updatedAt = new Date(Math.max(now, prev + 1)).toISOString();
}

// 公開中のコーデ・トレンドで使っているか（アイテムを非公開にするときの確認）
export function productUsage(productId: string) {
  const outfitIds = db.outfits.filter((o) => o.isPublished && outfitProductIds(o).includes(productId)).map((o) => o.id);
  const trendIds = db.trends.filter((t) => t.isPublished && t.productIds.includes(productId)).map((t) => t.id);
  return { outfitIds, trendIds };
}

// 変更履歴（docs/db.md 4.8）。DBではトリガーが記録するが、ダミー版ではここで記録する
export function writeAudit(userId: string | null, table: string, action: "insert" | "update" | "delete", oldData: unknown, newData: unknown) {
  db.auditLogs.push({
    id: nextId("auditLogs"),
    userId,
    tableName: table,
    action,
    oldData: oldData === null ? null : structuredClone(oldData),
    newData: newData === null ? null : structuredClone(newData),
    createdAt: nowIso(),
  });
}

export const snapshot = (row: Row) => structuredClone(row);
