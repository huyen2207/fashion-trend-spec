// 会員API の共通処理（お気に入り・最近見たもの・診断結果）
import type { Validator } from "./http";
import { isAge, isScene, isTaste } from "./query";
import { findPublished } from "./serializers";
import { db, nextId, nowIso, type ItemType } from "./store";

export const ITEM_TYPES: ItemType[] = ["trend", "outfit", "product"];
// パスのコレクション名（複数形）→ 種類（単数形）
export const COLLECTIONS: Record<string, ItemType> = { trends: "trend", outfits: "outfit", products: "product" };

export const isPublishedItem = (type: ItemType, id: string) => !!findPublished[type](id);

// お気に入りに追加（すでにあれば何もしない）。追加したら true
export function addFavorite(userId: string, type: ItemType, itemId: string): boolean {
  if (db.favorites.some((f) => f.userId === userId && f.type === type && f.itemId === itemId)) return false;
  db.favorites.push({ id: nextId("favorites"), userId, type, itemId, createdAt: nowIso() });
  return true;
}

// 最近見たものに記録（同じものは日時を更新）し、新しい8件だけを残す（docs/db.md 7.5）
const RECENT_MAX = 8;
export function addRecentView(userId: string, type: ItemType, itemId: string, viewedAt = nowIso()) {
  const row = db.recentViews.find((r) => r.userId === userId && r.type === type && r.itemId === itemId);
  if (row) {
    if (viewedAt > row.viewedAt) row.viewedAt = viewedAt;
  } else {
    db.recentViews.push({ id: nextId("recentViews"), userId, type, itemId, viewedAt });
  }
  const keep = new Set(
    db.recentViews
      .filter((r) => r.userId === userId)
      .sort((a, b) => b.viewedAt.localeCompare(a.viewedAt) || b.id - a.id)
      .slice(0, RECENT_MAX)
      .map((r) => r.id)
  );
  removeWhere(db.recentViews, (r) => r.userId === userId && !keep.has(r.id));
}

// 配列から条件に合う要素を取り除く（配列そのものは置き換えない）
export function removeWhere<T>(list: T[], pred: (x: T) => boolean) {
  for (let i = list.length - 1; i >= 0; i--) if (pred(list[i])) list.splice(i, 1);
}

// 診断の答えのチェック（C-10）
export function validateProfile(v: Validator, body: Record<string, unknown>) {
  const ageId = v.ref(body.ageId, "ageId", "年代", isAge);
  const sceneId = v.ref(body.sceneId, "sceneId", "シーン", isScene);
  const tasteIds = v.refList(body.tasteIds, "tasteIds", "テイスト", isTaste, { min: 1, max: 2 });
  return { ageId, tasteIds, sceneId };
}

export function saveProfile(userId: string, p: { ageId: string; tasteIds: string[]; sceneId: string }) {
  const now = nowIso();
  const row = db.styleProfiles.find((s) => s.userId === userId);
  if (row) Object.assign(row, p, { updatedAt: now });
  else db.styleProfiles.push({ userId, ...p, createdAt: now, updatedAt: now });
  return db.styleProfiles.find((s) => s.userId === userId)!;
}

export const profileJson = (p: { ageId: string; tasteIds: string[]; sceneId: string; updatedAt: string }) => ({
  ageId: p.ageId,
  tasteIds: p.tasteIds,
  sceneId: p.sceneId,
  updatedAt: p.updatedAt,
});
