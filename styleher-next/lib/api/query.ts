// 公開APIのクエリパラメーターで使う、マスタのIDの確認
import type { Validator } from "./http";
import { db, type MasterRow } from "./store";

const exists = (list: MasterRow[]) => (id: string) => list.some((x) => x.id === id && x.isPublished);
export const isAge = exists(db.ages);
export const isTaste = exists(db.tastes);
export const isScene = exists(db.scenes);
export const isCategory = exists(db.categories);
export const isColor = exists(db.colors);
export const isPostTag = exists(db.postTags);
export const isInquiryType = exists(db.inquiryTypes);

// 指定されていれば、存在するIDかを確認する
export function optionalRef(v: Validator, raw: string | null, field: string, label: string, ok: (id: string) => boolean) {
  if (raw === null) return undefined;
  if (!ok(raw)) v.add(field, `${label}「${raw}」は存在しません。`);
  return raw;
}
