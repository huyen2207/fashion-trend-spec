// 会員API の共通処理（お気に入り・最近見たもの・診断結果）
import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import { iso, type Db, type ItemType, type Masters } from "./catalog";
import type { Validator } from "./http";
import { masterChecks } from "./query";

export const ITEM_TYPES: ItemType[] = ["trend", "outfit", "product"];
// パスのコレクション名（複数形）→ 種類（単数形）
export const COLLECTIONS: Record<string, ItemType> = { trends: "trend", outfits: "outfit", products: "product" };

// お気に入り・最近見たものは、種類ごとに別の列（trend_id / outfit_id / product_id）に対象のIDを持つ（docs/db.md 4.6）
const ITEM_FIELD = { trend: "trendId", outfit: "outfitId", product: "productId" } as const;
const ITEM_COLUMN = { trend: "trend_id", outfit: "outfit_id", product: "product_id" } as const;
export const itemWhere = (type: ItemType, id: string) => ({ [ITEM_FIELD[type]]: id }) as { trendId?: string; outfitId?: string; productId?: string };

// 行から種類とIDを取り出す
export function itemOf(r: { trendId: string | null; outfitId: string | null; productId: string | null }): { type: ItemType; itemId: string } {
  if (r.trendId) return { type: "trend", itemId: r.trendId };
  if (r.outfitId) return { type: "outfit", itemId: r.outfitId };
  return { type: "product", itemId: r.productId! };
}

export async function isPublishedItem(type: ItemType, id: string, db: Db = prisma) {
  const where = { id, isPublished: true };
  const count =
    type === "trend" ? await db.trend.count({ where }) : type === "outfit" ? await db.outfit.count({ where }) : await db.product.count({ where });
  return count > 0;
}

// お気に入りに追加（すでにあれば何もしない）。追加したら true
export async function addFavorite(userId: string, type: ItemType, itemId: string, db: Db = prisma): Promise<boolean> {
  const { count } = await db.favorite.createMany({ data: [{ userId, ...itemWhere(type, itemId) }], skipDuplicates: true });
  return count > 0;
}

// 最近見たものに記録（同じものは日時を新しいほうにする）し、新しい8件だけを残す（docs/db.md 7.5）
const RECENT_MAX = 8;
export async function addRecentView(userId: string, type: ItemType, itemId: string, viewedAt = new Date(), db: Db = prisma) {
  // 列名は決まった3つから選ぶだけなので、SQL に直接入れてよい
  const column = Prisma.raw(ITEM_COLUMN[type]);
  await db.$executeRaw`
    INSERT INTO recent_views (user_id, ${column}, viewed_at) VALUES (${userId}::uuid, ${itemId}, ${viewedAt})
    ON CONFLICT (user_id, ${column}) DO UPDATE SET viewed_at = GREATEST(recent_views.viewed_at, EXCLUDED.viewed_at)`;
  await db.$executeRaw`
    DELETE FROM recent_views
    WHERE user_id = ${userId}::uuid
      AND id NOT IN (
        SELECT id FROM recent_views WHERE user_id = ${userId}::uuid ORDER BY viewed_at DESC, id DESC LIMIT ${RECENT_MAX}
      )`;
}

// 診断の答えのチェック（C-10）
export function validateProfile(v: Validator, m: Masters, body: Record<string, unknown>) {
  const { isAge, isScene, isTaste } = masterChecks(m);
  const ageId = v.ref(body.ageId, "ageId", "年代", isAge);
  const sceneId = v.ref(body.sceneId, "sceneId", "シーン", isScene);
  const tasteIds = v.refList(body.tasteIds, "tasteIds", "テイスト", isTaste, { min: 1, max: 2 });
  return { ageId, tasteIds, sceneId };
}

export type Profile = { ageId: string; tasteIds: string[]; sceneId: string };

// 診断結果を保存する（テイストは選んだ順を priority にして入れ直す）
export async function saveProfile(userId: string, p: Profile, db?: Db) {
  const run = async (tx: Db) => {
    await tx.styleProfile.upsert({
      where: { userId },
      create: { userId, ageId: p.ageId, sceneId: p.sceneId },
      update: { ageId: p.ageId, sceneId: p.sceneId },
    });
    await tx.styleProfileTaste.deleteMany({ where: { userId } });
    await tx.styleProfileTaste.createMany({ data: p.tasteIds.map((tasteId, i) => ({ userId, priority: i + 1, tasteId })) });
    return (await findProfile(userId, tx))!;
  };
  return db ? run(db) : prisma.$transaction(run);
}

export async function findProfile(userId: string, db: Db = prisma) {
  const row = await db.styleProfile.findUnique({ where: { userId }, include: { tastes: { orderBy: { priority: "asc" } } } });
  if (!row) return null;
  return { ageId: row.ageId, tasteIds: row.tastes.map((t) => t.tasteId), sceneId: row.sceneId, updatedAt: iso(row.updatedAt) };
}

export const profileJson = (p: { ageId: string; tasteIds: string[]; sceneId: string; updatedAt: string }) => ({
  ageId: p.ageId,
  tasteIds: p.tasteIds,
  sceneId: p.sceneId,
  updatedAt: p.updatedAt,
});
