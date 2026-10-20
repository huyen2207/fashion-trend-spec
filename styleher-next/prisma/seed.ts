// 初期データの登録（npm run db:seed）。
// lib/data.ts のデータを docs/db.md 8.1 の対応表にしたがって変換し、DB に入れる。
// ダミーの会員（lib/api/auth.ts の固定トークンで使う2人）も登録する。
//
//   npm run db:seed              … DB が空のときだけ登録する
//   npm run db:seed -- --reset   … すべてのテーブルを空にしてから登録し直す（お気に入りなども消える）
import "dotenv/config";
import { DUMMY_ADMIN_ID, DUMMY_MEMBER_ID } from "../lib/api/catalog";
import * as data from "../lib/data";
import { prisma } from "../lib/db";

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

// 付録A の34テーブル（_prisma_migrations は消さない）
const TABLES = [
  "audit_logs", "contact_inquiries", "newsletter_subscriptions", "style_profile_tastes", "style_profiles",
  "recent_views", "favorites", "users", "community_images", "hero_slides", "post_paragraphs", "posts",
  "outfit_tastes", "outfit_ages", "outfit_tips", "outfit_products", "outfits",
  "trend_products", "trend_tastes", "trend_ages", "trend_tips", "trend_points", "trend_images", "trends",
  "product_links", "products", "shops", "inquiry_types", "post_tags", "colors", "categories", "tastes", "ages", "scenes",
];

const master = (list: { id: string; name: string }[]) => list.map((x, i) => ({ id: x.id, name: x.name, sortOrder: i + 1 }));

async function main() {
  const reset = process.argv.includes("--reset");
  if (reset) {
    await prisma.$executeRawUnsafe(`TRUNCATE ${TABLES.join(", ")} RESTART IDENTITY CASCADE`);
    console.log("すべてのテーブルを空にしました");
  } else if (await prisma.scene.count()) {
    console.log("すでにデータがあるため、登録しませんでした（登録し直すときは npm run db:seed -- --reset）");
    return;
  }

  const colorNames = [...new Set(data.products.map((p) => p.color))];
  const tagIdOf = Object.fromEntries(POST_TAGS.map((t) => [t.name, t.id]));

  await prisma.$transaction(
    async (tx) => {
      const [{ max: auditBefore }] = await tx.$queryRaw<{ max: bigint | null }[]>`SELECT max(id) AS max FROM audit_logs`;

      // マスタ
      await tx.scene.createMany({ data: data.scenes.map((s, i) => ({ id: s.id, name: s.name, icon: s.icon, sortOrder: i + 1 })) });
      await tx.age.createMany({ data: master(data.ages) });
      await tx.taste.createMany({ data: master(data.tastes) });
      // 画面用の「すべて（all）」はDBに持たない
      await tx.category.createMany({ data: master(data.categories.filter((c) => c.id !== "all")) });
      await tx.color.createMany({ data: master(colorNames.map((name) => ({ id: COLOR_IDS[name], name }))) });
      await tx.postTag.createMany({ data: master(POST_TAGS) });
      await tx.inquiryType.createMany({ data: master(INQUIRY_TYPES) });

      // ショップ・アイテム（アイテムと購入リンクは同じトランザクションで登録する。docs/db.md 4.2）
      await tx.shop.createMany({
        data: data.shops.map((s, i) => {
          const id = SHOP_IDS[s.name];
          return { id, name: s.name, url: s.url, shopType: s.type, searchUrlTemplate: SEARCH_URL_TEMPLATES[id] ?? null, sortOrder: i + 1 };
        }),
      });
      await tx.product.createMany({
        data: data.products.map((p, i) => ({
          id: p.id,
          name: p.name,
          categoryId: p.cat,
          colorId: COLOR_IDS[p.color],
          price: p.price,
          recommendedShopId: SHOP_IDS[p.shop],
          image: p.img,
          searchKeyword: p.q,
          sortOrder: i + 1,
        })),
      });
      // URLは型から作れるので custom_url は空（docs/db.md 8.1）
      await tx.productLink.createMany({
        data: data.products.flatMap((p) => p.links.map((l) => ({ productId: p.id, shopId: SHOP_IDS[l.shop] }))),
      });

      // トレンド
      await tx.trend.createMany({
        data: data.trends.map((t, i) => ({
          id: t.id,
          name: t.name,
          subtitle: t.sub,
          image: t.img,
          hotScore: t.hot,
          season: t.season,
          postCount: t.posts,
          description: t.desc,
          sortOrder: i + 1,
        })),
      });
      await tx.trendImage.createMany({ data: data.trends.flatMap((t) => t.gallery.map((image, i) => ({ trendId: t.id, sortOrder: i + 1, image }))) });
      await tx.trendPoint.createMany({ data: data.trends.flatMap((t) => t.points.map((body, i) => ({ trendId: t.id, sortOrder: i + 1, body }))) });
      await tx.trendTip.createMany({ data: data.trends.flatMap((t) => t.tips.map((body, i) => ({ trendId: t.id, sortOrder: i + 1, body }))) });
      await tx.trendAge.createMany({ data: data.trends.flatMap((t) => t.ages.map((ageId) => ({ trendId: t.id, ageId }))) });
      await tx.trendTaste.createMany({ data: data.trends.flatMap((t) => t.tastes.map((tasteId) => ({ trendId: t.id, tasteId }))) });
      await tx.trendProduct.createMany({
        data: data.trends.flatMap((t) => t.products.map((productId, i) => ({ trendId: t.id, productId, sortOrder: i + 1 }))),
      });

      // コーデ（main は表示順 0、item は 1 から）
      await tx.outfit.createMany({
        data: data.outfits.map((o, i) => ({ id: o.id, sceneId: o.scene, title: o.title, image: o.img, description: o.desc, sortOrder: i + 1 })),
      });
      await tx.outfitProduct.createMany({
        data: data.outfits.flatMap((o) => [
          ...(o.main ? [{ outfitId: o.id, productId: o.main, role: "main", sortOrder: 0 }] : []),
          ...o.items.map((productId, i) => ({ outfitId: o.id, productId, role: "item", sortOrder: i + 1 })),
        ]),
      });
      await tx.outfitTip.createMany({ data: data.outfits.flatMap((o) => o.tips.map((body, i) => ({ outfitId: o.id, sortOrder: i + 1, body }))) });
      await tx.outfitAge.createMany({ data: data.outfits.flatMap((o) => o.ages.map((ageId) => ({ outfitId: o.id, ageId }))) });
      await tx.outfitTaste.createMany({ data: data.outfits.flatMap((o) => o.tastes.map((tasteId) => ({ outfitId: o.id, tasteId }))) });

      // コラム・トップページ
      await tx.post.createMany({
        data: data.posts.map((p) => ({
          id: p.id,
          title: p.title,
          tagId: tagIdOf[p.tag],
          publishedOn: new Date(`${p.date}T00:00:00Z`),
          image: p.img,
          excerpt: p.excerpt,
        })),
      });
      await tx.postParagraph.createMany({ data: data.posts.flatMap((p) => p.body.map((body, i) => ({ postId: p.id, sortOrder: i + 1, body }))) });
      // id は自動採番（GENERATED ALWAYS）なので指定しない
      await tx.heroSlide.createMany({
        data: data.heroSlides.map((h, i) => ({ image: h.img, imagePosition: h.pos ?? "center 30%", title: h.title, body: h.text, sortOrder: i + 1 })),
      });
      await tx.communityImage.createMany({ data: data.community.map((image, i) => ({ image, sortOrder: i + 1 })) });

      // ダミーの会員
      await tx.user.createMany({
        data: [
          { id: DUMMY_MEMBER_ID, email: "hanako@example.com", role: "member" },
          { id: DUMMY_ADMIN_ID, email: "admin@example.com", role: "admin" },
        ],
        skipDuplicates: true,
      });

      // 初期データの登録は運営者の変更ではないので、トリガーが書いた変更履歴は残さない
      await tx.auditLog.deleteMany({ where: { id: { gt: auditBefore ?? 0n } } });
    },
    { timeout: 120_000, maxWait: 30_000 }
  );

  const counts = {
    アイテム: await prisma.product.count(),
    購入リンク: await prisma.productLink.count(),
    トレンド: await prisma.trend.count(),
    コーデ: await prisma.outfit.count(),
    コラム: await prisma.post.count(),
    会員: await prisma.user.count(),
  };
  console.log("初期データを登録しました", counts);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
