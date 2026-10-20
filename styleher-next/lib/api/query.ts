// 公開APIのクエリパラメーターで使う、マスタのIDの確認
import type { MasterRow, Masters } from "./catalog";
import type { Validator } from "./http";

// 公開中のマスタにあるIDか
export const exists = (list: MasterRow[]) => (id: string) => list.some((x) => x.id === id && x.isPublished);
export const masterChecks = (m: Masters) => ({
  isAge: exists(m.ages),
  isTaste: exists(m.tastes),
  isScene: exists(m.scenes),
  isCategory: exists(m.categories),
  isColor: exists(m.colors),
  isPostTag: exists(m.postTags),
  isInquiryType: exists(m.inquiryTypes),
});

// 指定されていれば、存在するIDかを確認する
export function optionalRef(v: Validator, raw: string | null, field: string, label: string, ok: (id: string) => boolean) {
  if (raw === null) return undefined;
  if (!ok(raw)) v.add(field, `${label}「${raw}」は存在しません。`);
  return raw;
}
