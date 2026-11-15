// 診断のおすすめ（設計書.md 4.9）
// 年代は必ず合わせる（選んだ年代向けのものだけを出す）。その中で、テイスト・シーンの点数が高い順に並べる
import type { Catalog } from "./catalog";
import { outfitSummary, publishedOutfits, publishedTrends, trendSummary } from "./serializers";

export type Answers = { ageId: string; tasteIds: string[]; sceneId: string };

export function recommend(c: Catalog, { ageId, tasteIds, sceneId }: Answers) {
  const [main, sub] = tasteIds;
  // 1つ目のテイストは w 点、2つ目は w/2 点
  const tasteScore = (list: string[], w: number) => (list.includes(main) ? w : 0) + (sub && list.includes(sub) ? w / 2 : 0);
  // 選んだ年代向けのものだけを、点の高い順に。同じ点なら並び順（安定ソート）。
  // テイスト・シーンが合うものが足りないときは、同じ年代向けのもので埋める（0件にしない）
  const top = <T extends { ageIds: string[] },>(list: T[], score: (x: T) => number, n: number) =>
    list
      .filter((x) => x.ageIds.includes(ageId))
      .map((x) => ({ x, score: score(x) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, n)
      .map((r) => r.x);
  return {
    // 点数そのものは返さない（内部の値。docs/api.md 3.2）
    trends: top(publishedTrends(c), (t) => tasteScore(t.tasteIds, 4), 2).map(trendSummary),
    outfits: top(publishedOutfits(c), (o) => (o.sceneId === sceneId ? 4 : 0) + tasteScore(o.tasteIds, 2), 4).map((o) =>
      outfitSummary(c, o)
    ),
  };
}
