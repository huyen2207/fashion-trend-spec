// ===== 管理API のリソース定義（docs/api.md 4.4・8章） =====
// /admin/{resource} で扱う14種類のリソースについて、入力チェックと保存のしかたを決める。
// 削除のAPIはない（削除の代わりに非公開にする）。
// 変更履歴（audit_logs）は DB のトリガーが記録する。変更した人は、同じトランザクションで app.user_id に入れて渡す（docs/db.md 4.8）。
import { prisma } from "@/lib/db";
import type { Catalog, Db, MasterRow } from "./catalog";
import { Validator } from "./http";
import { bySortOrder, outfitProductIds } from "./serializers";

export type Row = Record<string, unknown> & { id: string | number; isPublished: boolean; createdAt: string; updatedAt: string };
type Body = Record<string, unknown>;
type Data = Record<string, unknown>;

export type ResourceDef = {
  table: string; // DBのテーブル名
  rows: (c: Catalog) => Row[];
  autoId?: boolean; // 自動採番のリソース
  order: (a: Row, b: Row) => number;
  searchText: (r: Row) => string; // 一覧の q（名前・タイトルの部分一致）
  parse: (body: Body, v: Validator, c: Catalog, currentId?: string | number) => Data; // POST・PUT の全項目
  // 登録（isNew）・更新。子テーブルを持つものは入れ直す。登録した行の id を返す
  save: (tx: Db, id: string | number | undefined, data: Data, isNew: boolean) => Promise<string | number>;
  // 公開フラグ・並び順だけを変える（PATCH）
  patch: (tx: Db, id: string | number, changes: Data) => Promise<unknown>;
  hasSortOrder: boolean;
};

// 子テーブルを持たないテーブルの Prisma の操作（モデルごとの型の違いは、入力チェック済みのデータを渡すことで吸収する）
type SimpleDelegate = {
  create(args: { data: Data }): Promise<{ id: string | number }>;
  update(args: { where: { id: string | number }; data: Data }): Promise<unknown>;
};
type Model = (tx: Db) => SimpleDelegate;
const model = (pick: (tx: Db) => unknown): Model => (tx) => pick(tx) as SimpleDelegate;

function simpleSave(m: Model): ResourceDef["save"] {
  return async (tx, id, data, isNew) => {
    if (!isNew) {
      await m(tx).update({ where: { id: id! }, data });
      return id!;
    }
    const row = await m(tx).create({ data: id === undefined ? data : { id, ...data } });
    return row.id;
  };
}
const simplePatch = (m: Model): ResourceDef["patch"] => (tx, id, changes) => m(tx).update({ where: { id }, data: changes });

const byOrder = (a: Row, b: Row) => bySortOrder({ sortOrder: Number(a.sortOrder), id: a.id }, { sortOrder: Number(b.sortOrder), id: b.id });
const has = <T extends { id: string }>(list: T[]) => (id: string) => list.some((x) => x.id === id);
const sortOrderOf = (v: Validator, body: Body) => v.int(body.sortOrder, "sortOrder", "並び順", { min: -32768, max: 32767 });

// 名前の重複チェック（自分以外に同じ名前がないか）
function uniqueName(v: Validator, list: { id: string; name: string }[], name: string, currentId?: string | number) {
  if (name && list.some((x) => x.name === name && x.id !== currentId)) v.add("name", `「${name}」はすでに使われています。`);
}

// ---- マスタ（7種類） ----
type MasterKey = "scenes" | "ages" | "tastes" | "categories" | "colors" | "postTags" | "inquiryTypes";
function masterDef(table: string, key: MasterKey, m: Model, nameMax = 30): ResourceDef {
  return {
    table,
    rows: (c) => c[key] as unknown as Row[],
    order: byOrder,
    hasSortOrder: true,
    searchText: (r) => String(r.name),
    parse: (b, v, c, currentId) => {
      const name = v.str(b.name, "name", { max: nameMax, label: "名前" });
      uniqueName(v, c[key] as MasterRow[], name, currentId);
      const data: Data = { name, sortOrder: sortOrderOf(v, b), isPublished: v.bool(b.isPublished, "isPublished", "公開") };
      if (key === "scenes") {
        const icons = ["briefcase", "bag", "heart", "sparkle", "plane", "home"];
        if (!icons.includes(b.icon as string)) v.add("icon", `アイコンは ${icons.join(" / ")} のいずれかにしてください。`);
        data.icon = b.icon;
      }
      return data;
    },
    save: simpleSave(m),
    patch: simplePatch(m),
  };
}

type ProductLinkInput = { shopId: string; customUrl: string | null };

export const RESOURCES: Record<string, ResourceDef> = {
  scenes: masterDef("scenes", "scenes", model((tx) => tx.scene)),
  ages: masterDef("ages", "ages", model((tx) => tx.age)),
  tastes: masterDef("tastes", "tastes", model((tx) => tx.taste)),
  categories: masterDef("categories", "categories", model((tx) => tx.category)),
  colors: masterDef("colors", "colors", model((tx) => tx.color)),
  "post-tags": masterDef("post_tags", "postTags", model((tx) => tx.postTag)),
  "inquiry-types": masterDef("inquiry_types", "inquiryTypes", model((tx) => tx.inquiryType), 50),

  shops: {
    table: "shops",
    rows: (c) => c.shops as unknown as Row[],
    order: byOrder,
    hasSortOrder: true,
    searchText: (r) => String(r.name),
    parse: (b, v, c, currentId) => {
      const name = v.str(b.name, "name", { max: 50, label: "ショップ名" });
      uniqueName(v, c.shops, name, currentId);
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
    save: simpleSave(model((tx) => tx.shop)),
    patch: simplePatch(model((tx) => tx.shop)),
  },

  products: {
    table: "products",
    rows: (c) => c.products as unknown as Row[],
    order: byOrder,
    hasSortOrder: true,
    searchText: (r) => String(r.name),
    parse: (b, v, c) => {
      const recommendedShopId = v.ref(b.recommendedShopId, "recommendedShopId", "おすすめのショップ", has(c.shops));
      const links: ProductLinkInput[] = [];
      if (!Array.isArray(b.links) || !b.links.length) v.add("links", "購入リンクを1件以上入れてください。");
      else
        b.links.forEach((l: unknown, i) => {
          const link = (l ?? {}) as Body;
          const shopId = v.ref(link.shopId, `links[${i}].shopId`, "ショップ", has(c.shops));
          const customUrl = link.customUrl === null || link.customUrl === undefined ? null : v.url(link.customUrl, `links[${i}].customUrl`, "個別のURL", 1000);
          // 検索URLの型を持たないショップには、個別のURLが必要
          if (shopId && !customUrl && !c.shops.find((s) => s.id === shopId)?.searchUrlTemplate)
            v.add(`links[${i}].customUrl`, "このショップには検索URLの型がないため、個別のURLを入れてください。");
          if (links.some((x) => x.shopId === shopId)) v.add(`links[${i}].shopId`, "同じショップが2回入っています。");
          links.push({ shopId, customUrl });
        });
      // おすすめのショップの購入リンクが必ずあること（DBでは fk_products_recommended_link でも守る）
      if (recommendedShopId && links.length && !links.some((l) => l.shopId === recommendedShopId))
        v.add("links", "おすすめのショップの購入リンクを入れてください。");
      return {
        name: v.str(b.name, "name", { max: 100, label: "アイテム名" }),
        categoryId: v.ref(b.categoryId, "categoryId", "カテゴリー", has(c.categories)),
        colorId: v.ref(b.colorId, "colorId", "カラー", has(c.colors)),
        price: v.int(b.price, "price", "参考価格", { min: 0, max: 10_000_000 }),
        recommendedShopId,
        image: v.str(b.image, "image", { max: 255, label: "画像" }),
        searchKeyword: v.str(b.searchKeyword, "searchKeyword", { max: 100, label: "検索キーワード" }),
        sortOrder: sortOrderOf(v, b),
        isPublished: v.bool(b.isPublished, "isPublished", "公開"),
        links,
      };
    },
    // アイテムと購入リンクは同じトランザクションで保存する（おすすめのショップのリンクはコミット時に確認される）
    save: async (tx, id, data, isNew) => {
      const { links, ...fields } = data as Data & { links: ProductLinkInput[] };
      const productId = String(id);
      await simpleSave(model((t) => t.product))(tx, productId, fields, isNew);
      await tx.productLink.deleteMany({ where: { productId } });
      await tx.productLink.createMany({ data: links.map((l) => ({ productId, shopId: l.shopId, customUrl: l.customUrl })) });
      return productId;
    },
    patch: simplePatch(model((tx) => tx.product)),
  },

  trends: {
    table: "trends",
    rows: (c) => c.trends as unknown as Row[],
    order: byOrder,
    hasSortOrder: true,
    searchText: (r) => String(r.name),
    parse: (b, v, c) => ({
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
      ageIds: v.refList(b.ageIds, "ageIds", "年代", has(c.ages)),
      tasteIds: v.refList(b.tasteIds, "tasteIds", "テイスト", has(c.tastes)),
      productIds: v.refList(b.productIds, "productIds", "アイテム", has(c.products)),
    }),
    // 子テーブル（画像・ポイント・コツ・年代・テイスト・アイテム）は全部消して入れ直す（docs/db.md 2.4）
    save: async (tx, id, data, isNew) => {
      const { images, points, tips, ageIds, tasteIds, productIds, ...fields } = data as Data & Record<
        "images" | "points" | "tips" | "ageIds" | "tasteIds" | "productIds",
        string[]
      >;
      const trendId = String(id);
      await simpleSave(model((t) => t.trend))(tx, trendId, fields, isNew);
      const where = { where: { trendId } };
      await Promise.all([
        tx.trendImage.deleteMany(where),
        tx.trendPoint.deleteMany(where),
        tx.trendTip.deleteMany(where),
        tx.trendAge.deleteMany(where),
        tx.trendTaste.deleteMany(where),
        tx.trendProduct.deleteMany(where),
      ]);
      await Promise.all([
        tx.trendImage.createMany({ data: images.map((image, i) => ({ trendId, sortOrder: i + 1, image })) }),
        tx.trendPoint.createMany({ data: points.map((body, i) => ({ trendId, sortOrder: i + 1, body })) }),
        tx.trendTip.createMany({ data: tips.map((body, i) => ({ trendId, sortOrder: i + 1, body })) }),
        tx.trendAge.createMany({ data: ageIds.map((ageId) => ({ trendId, ageId })) }),
        tx.trendTaste.createMany({ data: tasteIds.map((tasteId) => ({ trendId, tasteId })) }),
        tx.trendProduct.createMany({ data: productIds.map((productId, i) => ({ trendId, productId, sortOrder: i + 1 })) }),
      ]);
      return trendId;
    },
    patch: simplePatch(model((tx) => tx.trend)),
  },

  outfits: {
    table: "outfits",
    rows: (c) => c.outfits as unknown as Row[],
    order: byOrder,
    hasSortOrder: true,
    searchText: (r) => String(r.title),
    parse: (b, v, c) => {
      const mainProductId =
        b.mainProductId === null || b.mainProductId === undefined ? null : v.ref(b.mainProductId, "mainProductId", "主役アイテム", has(c.products));
      const itemProductIds = v.refList(b.itemProductIds, "itemProductIds", "アイテム", has(c.products));
      if (mainProductId && itemProductIds.includes(mainProductId)) v.add("mainProductId", "主役アイテムはサムネイルのアイテムと別にしてください。");
      return {
        sceneId: v.ref(b.sceneId, "sceneId", "シーン", has(c.scenes)),
        title: v.str(b.title, "title", { max: 100, label: "タイトル" }),
        image: v.str(b.image, "image", { max: 255, label: "コーデ画像" }),
        description: v.str(b.description, "description", { max: 5000, label: "説明" }),
        sortOrder: sortOrderOf(v, b),
        isPublished: v.bool(b.isPublished, "isPublished", "公開"),
        mainProductId,
        itemProductIds,
        tips: v.strList(b.tips, "tips", "コツ", 200),
        ageIds: v.refList(b.ageIds, "ageIds", "年代", has(c.ages)),
        tasteIds: v.refList(b.tasteIds, "tasteIds", "テイスト", has(c.tastes)),
      };
    },
    save: async (tx, id, data, isNew) => {
      const { mainProductId, itemProductIds, tips, ageIds, tasteIds, ...fields } = data as Data & { mainProductId: string | null } & Record<
        "itemProductIds" | "tips" | "ageIds" | "tasteIds",
        string[]
      >;
      const outfitId = String(id);
      await simpleSave(model((t) => t.outfit))(tx, outfitId, fields, isNew);
      const where = { where: { outfitId } };
      await Promise.all([tx.outfitProduct.deleteMany(where), tx.outfitTip.deleteMany(where), tx.outfitAge.deleteMany(where), tx.outfitTaste.deleteMany(where)]);
      await Promise.all([
        // 写真の主役（main）は表示順 0、サムネイル（item）は 1 から
        tx.outfitProduct.createMany({
          data: [
            ...(mainProductId ? [{ outfitId, productId: mainProductId, role: "main", sortOrder: 0 }] : []),
            ...itemProductIds.map((productId, i) => ({ outfitId, productId, role: "item", sortOrder: i + 1 })),
          ],
        }),
        tx.outfitTip.createMany({ data: tips.map((body, i) => ({ outfitId, sortOrder: i + 1, body })) }),
        tx.outfitAge.createMany({ data: ageIds.map((ageId) => ({ outfitId, ageId })) }),
        tx.outfitTaste.createMany({ data: tasteIds.map((tasteId) => ({ outfitId, tasteId })) }),
      ]);
      return outfitId;
    },
    patch: simplePatch(model((tx) => tx.outfit)),
  },

  posts: {
    table: "posts",
    rows: (c) => c.posts as unknown as Row[],
    // 公開日の新しい順
    order: (a, b) => String(b.publishedOn).localeCompare(String(a.publishedOn)) || String(a.id).localeCompare(String(b.id)),
    hasSortOrder: false,
    searchText: (r) => String(r.title),
    parse: (b, v, c) => {
      const publishedOn = typeof b.publishedOn === "string" ? b.publishedOn : "";
      if (!/^\d{4}-\d{2}-\d{2}$/.test(publishedOn) || Number.isNaN(Date.parse(publishedOn))) v.add("publishedOn", "公開日は YYYY-MM-DD で指定してください。");
      return {
        title: v.str(b.title, "title", { max: 100, label: "タイトル" }),
        tagId: v.ref(b.tagId, "tagId", "タグ", has(c.postTags)),
        publishedOn,
        image: v.str(b.image, "image", { max: 255, label: "画像" }),
        excerpt: v.str(b.excerpt, "excerpt", { max: 200, label: "概要" }),
        isPublished: v.bool(b.isPublished, "isPublished", "公開"),
        paragraphs: v.strList(b.paragraphs, "paragraphs", "本文の段落", 10000),
      };
    },
    save: async (tx, id, data, isNew) => {
      const { paragraphs, publishedOn, ...fields } = data as Data & { paragraphs: string[]; publishedOn: string };
      const postId = String(id);
      await simpleSave(model((t) => t.post))(tx, postId, { ...fields, publishedOn: new Date(`${publishedOn}T00:00:00Z`) }, isNew);
      await tx.postParagraph.deleteMany({ where: { postId } });
      await tx.postParagraph.createMany({ data: paragraphs.map((body, i) => ({ postId, sortOrder: i + 1, body })) });
      return postId;
    },
    patch: simplePatch(model((tx) => tx.post)),
  },

  "hero-slides": {
    table: "hero_slides",
    rows: (c) => c.heroSlides as unknown as Row[],
    autoId: true,
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
    save: simpleSave(model((tx) => tx.heroSlide)),
    patch: simplePatch(model((tx) => tx.heroSlide)),
  },

  "community-images": {
    table: "community_images",
    rows: (c) => c.communityImages as unknown as Row[],
    autoId: true,
    order: byOrder,
    hasSortOrder: true,
    searchText: (r) => String(r.image),
    parse: (b, v) => ({
      image: v.str(b.image, "image", { max: 255, label: "画像" }),
      sortOrder: sortOrderOf(v, b),
      isPublished: v.bool(b.isPublished, "isPublished", "公開"),
    }),
    save: simpleSave(model((tx) => tx.communityImage)),
    patch: simplePatch(model((tx) => tx.communityImage)),
  },
};

export function findRow(def: ResourceDef, c: Catalog, id: string): Row | undefined {
  return def.rows(c).find((r) => String(r.id) === id);
}

// 運営者の変更を1つのトランザクションで行う。変更した人を app.user_id に入れ、トリガーが変更履歴に記録する
export function inAuditedTransaction<T>(userId: string, fn: (tx: Db) => Promise<T>): Promise<T> {
  return prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT set_config('app.user_id', ${userId}, true)`;
      return fn(tx);
    },
    { timeout: 20_000, maxWait: 10_000 }
  );
}

// 公開中のコーデ・トレンドで使っているか（アイテムを非公開にするときの確認）
export function productUsage(c: Catalog, productId: string) {
  const outfitIds = c.outfits.filter((o) => o.isPublished && outfitProductIds(o).includes(productId)).map((o) => o.id);
  const trendIds = c.trends.filter((t) => t.isPublished && t.productIds.includes(productId)).map((t) => t.id);
  return { outfitIds, trendIds };
}
